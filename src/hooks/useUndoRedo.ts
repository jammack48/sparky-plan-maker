import { useState, useEffect } from "react";
import { Canvas as FabricCanvas } from "fabric";

export const useUndoRedo = (fabricCanvas: FabricCanvas | null) => {
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const saveCanvasState = (canvas?: FabricCanvas) => {
    const targetCanvas = canvas || fabricCanvas;
    if (!targetCanvas) return;
    
    const json = JSON.stringify(targetCanvas.toJSON());
    setUndoStack(prev => [...prev, json]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!fabricCanvas || undoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, undoStack, redoStack]);

  return {
    undoStack,
    redoStack,
    saveCanvasState,
    handleUndo,
    handleRedo,
  };
};
