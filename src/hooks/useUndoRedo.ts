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
    if (!fabricCanvas) return;
    if (undoStack.length <= 1) return; // nothing to undo

    console.info('[Undo] Before:', {
      undoStackLength: undoStack.length,
      redoStackLength: redoStack.length
    });

    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];

    // Move current state to redo stack
    setRedoStack(prev => [...prev, currentState]);
    // Remove current state from undo stack
    setUndoStack(prev => prev.slice(0, -1));

    console.info('[Undo] After:', {
      undoStackLength: undoStack.length - 1,
      redoStackLength: redoStack.length + 1
    });

    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas) return;
    if (redoStack.length === 0) return;

    console.info('[Redo] Before:', {
      undoStackLength: undoStack.length,
      redoStackLength: redoStack.length
    });

    const nextState = redoStack[redoStack.length - 1];

    // Move next state back to undo stack
    setUndoStack(prev => [...prev, nextState]);
    setRedoStack(prev => prev.slice(0, -1));

    console.info('[Redo] After:', {
      undoStackLength: undoStack.length + 1,
      redoStackLength: redoStack.length - 1
    });

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
