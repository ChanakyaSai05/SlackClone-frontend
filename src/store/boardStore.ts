import { create } from "zustand";
import { api } from "../services/api";
import { Board, Section, Card } from "../types/board";
import { socket } from "../services/socket";

interface BoardState {
  boards: Board[];
  sections: Section[];
  cards: Card[];
  activeBoard: string | null;
  loading: boolean;
  error: string | null;
  fetchBoards: (channelId: string) => Promise<void>;
  fetchBoardData: (boardId: string) => Promise<void>;
  createBoard: (data: Partial<Board>) => Promise<Board>;
  createSection: (data: Partial<Section>) => Promise<Section>;
  deleteSection: (sectionId: string) => Promise<void>;
  createCard: (data: Partial<Card>) => Promise<Card>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (
    cardId: string,
    newSectionId: string,
    newOrder: number
  ) => Promise<void>;
  setActiveBoard: (boardId: string | null) => void;
  deleteBoard: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  sections: [],
  cards: [],
  activeBoard: null,
  loading: false,
  error: null,

  fetchBoards: async (channelId) => {
    set({ loading: true });
    try {
      const response = await api.get(`/api/boards/channel/${channelId}`);
      set({ boards: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch boards", loading: false });
      throw error;
    }
  },

  fetchBoardData: async (boardId) => {
    set({ loading: true });
    try {
      const [sectionsRes, cardsRes] = await Promise.all([
        api.get(`/api/sections/board/${boardId}`),
        api.get(`/api/cards/board/${boardId}`),
      ]);

      set({
        sections: sectionsRes.data,
        cards: cardsRes.data,
        loading: false,
        activeBoard: boardId,
      });

      // Clean up existing listeners
      socket.off("section_created");
      socket.off("section_deleted");
      socket.off("card_updated");
      socket.off("card_deleted");
      socket.off("card_created");
      socket.off("card_moved");
      socket.off("new_card");
      socket.off("delete_card");
      socket.off("new_section");
      socket.off("delete_section");

      // Join the board's socket room
      socket.emit("join_board", boardId);

      // Set up socket listeners
      socket.on("section_created", (section) => {
        if (section.boardId === boardId) {
          set((state) => ({
            sections: [...state.sections, section],
          }));
        }
      });
      socket.on("new_section", (section) => {
        if (section.boardId === boardId) {
          set((state) => ({
            sections: [...state.sections, section],
          }));
        }
      });

      socket.on("section_deleted", (data) => {
        set((state) => ({
          sections: state.sections.filter((s) => s._id !== data.sectionId),
          cards: state.cards.filter((c) => c.sectionId !== data.sectionId),
        }));
      });
      socket.on("delete_section", (data) => {
        set((state) => ({
          sections: state.sections.filter((s) => s._id !== data.sectionId),
          cards: state.cards.filter((c) => c.sectionId !== data.sectionId),
        }));
      });

      socket.on("card_updated", (data) => {
        if (data.boardId === boardId) {
          set((state) => ({
            cards: state.cards.map((card) =>
              card._id === data.card._id ? data.card : card
            ),
          }));
        }
      });

      socket.on("card_deleted", (data) => {
        if (data.boardId === boardId) {
          set((state) => ({
            cards: state.cards.filter((card) => card._id !== data.cardId),
          }));
        }
      });

      socket.on("delete_card", (data) => {
        console.log("delete_card", data);
        if (data.boardId === boardId) {
          set((state) => ({
            cards: state.cards.filter((card) => card._id !== data.cardId),
          }));
        }
      });

      socket.on("card_created", (data) => {
        if (data.boardId === boardId) {
          set((state) => ({
            cards: [...state.cards, data.card],
          }));
        }
      });

      socket.on("card_moved", (data) => {
        if (data.boardId === boardId) {
          set((state) => ({
            cards: state.cards.map((card) =>
              card._id === data.card._id ? data.card : card
            ),
          }));
        }
      });

      socket.on("new_card", (data) => {
        if (data.boardId === boardId) {
          set((state) => ({
            cards: [...state.cards, data.card],
          }));
        }
      });
    } catch (error) {
      set({ error: "Failed to fetch board data", loading: false });
      throw error;
    }
  },

  createBoard: async (data) => {
    try {
      const response = await api.post("/api/boards", data);
      const newBoard = response.data;
      set((state) => ({
        boards: [...state.boards, newBoard],
        activeBoard: newBoard._id,
      }));
      return newBoard;
    } catch (error) {
      console.error("Error creating board:", error);
      throw new Error("Error creating board");
    }
  },
  deleteBoard: async (boardId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this board? This will delete all sections and cards associated with this board."
      )
    ) {
      try {
        await api.delete(`/api/boards/${boardId}`);
        set((state) => ({
          boards: state.boards.filter((b) => b._id !== boardId),
          activeBoard: null,
          sections: [],
          cards: [],
        }));
      } catch (error) {
        set({ error: "Failed to delete board" });
        throw error;
      }
    }
  },
  createSection: async (data) => {
    try {
      const response = await api.post("/api/sections", data);
      const newSection = response.data;
      set((state) => ({
        sections: [...state.sections, newSection],
      }));
      socket.emit("section_created", newSection);
      return newSection;
    } catch (error) {
      set({ error: "Failed to create section" });
      throw error;
    }
  },

  deleteSection: async (sectionId) => {
    try {
      await api.delete(`/api/sections/${sectionId}`);
      set((state) => ({
        sections: state.sections.filter((s) => s._id !== sectionId),
        cards: state.cards.filter((c) => c.sectionId !== sectionId),
      }));
      socket.emit("section_deleted", {
        boardId: get().activeBoard,
        sectionId,
      });
    } catch (error) {
      set({ error: "Failed to delete section" });
      throw error;
    }
  },

  createCard: async (data) => {
    try {
      const response = await api.post("/api/cards", data);
      const newCard = response.data;
      set((state) => ({
        cards: [...state.cards, newCard],
      }));
      socket.emit("card_created", {
        boardId: get().activeBoard,
        card: newCard,
      });
      return newCard;
    } catch (error) {
      set({ error: "Failed to create card" });
      throw error;
    }
  },

  updateCard: async (cardId, updates) => {
    try {
      const response = await api.patch(`/api/cards/${cardId}`, updates);
      const updatedCard = response.data;
      set((state) => ({
        cards: state.cards.map((card) =>
          card._id === cardId ? updatedCard : card
        ),
      }));
      socket.emit("card_updated", {
        boardId: get().activeBoard,
        card: updatedCard,
      });
    } catch (error) {
      set({ error: "Failed to update card" });
      throw error;
    }
  },

  deleteCard: async (cardId) => {
    try {
      await api.delete(`/api/cards/${cardId}`);
      set((state) => ({
        cards: state.cards.filter((card) => card._id !== cardId),
      }));
      socket.emit("card_deleted", {
        boardId: get().activeBoard,
        cardId,
      });
    } catch (error) {
      set({ error: "Failed to delete card" });
      throw error;
    }
  },

  moveCard: async (cardId, newSectionId, newOrder) => {
    try {
      const response = await api.patch(`/api/cards/${cardId}/move`, {
        newSectionId,
        newOrder,
      });

      const updatedCard = response.data;
      set((state) => ({
        cards: state.cards.map((card) =>
          card._id === cardId ? updatedCard : card
        ),
      }));

      socket.emit("card_moved", {
        boardId: get().activeBoard,
        card: updatedCard,
      });
    } catch (error) {
      set({ error: "Failed to move card" });
      throw error;
    }
  },

  setActiveBoard: (boardId) => {
    // Clean up socket listeners when changing boards
    if (get().activeBoard) {
      socket.off("section_created");
      socket.off("section_deleted");
      socket.off("card_updated");
      socket.off("card_deleted");
      socket.off("card_created");
      socket.off("card_moved");
      socket.emit("leave_board", get().activeBoard);
    }
    set({ activeBoard: boardId });
  },
}));
