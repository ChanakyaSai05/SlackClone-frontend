import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { socket } from '../../services/socket';

interface AnnotationCanvasProps {
  isScreenSharing: boolean;
  recipientId: string;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  isScreenSharing,
  recipientId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isScreenSharing) return;

    // Initialize Fabric canvas
    fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const canvas = fabricCanvasRef.current;

    // Set up drawing brush
    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = '#ff0000';

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Handle drawing events
    canvas.on('path:created', (e: any) => {
      const path = e.path;
      const pathData = path.toJSON();
      
      // Emit the drawing data to the other peer
      socket.emit('annotation_data', {
        targetUserId: recipientId,
        pathData,
      });
    });

    // Listen for annotation data from the other peer
    socket.on('receive_annotation', ({ pathData }) => {
      fabric.util.enlivenObjects([pathData], (objects: fabric.Object[]) => {
        objects.forEach(obj => {
          canvas.add(obj);
          canvas.renderAll();
        });
      });
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('receive_annotation');
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [isScreenSharing, recipientId]);

  if (!isScreenSharing) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto z-50"
    />
  );
};