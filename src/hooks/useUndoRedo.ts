import { useState, useEffect, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";

export const useUndoRedo = (fabricCanvas: FabricCanvas | null) => {
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const saveCanvasState = (canvas?: FabricCanvas) => {
    const targetCanvas = canvas || fabricCanvas;
    if (!targetCanvas) return;
    
    const json = JSON.stringify(targetCanvas.toObject(['isBackgroundImage', 'backgroundLocked']));
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
      // Re-tag objects with name='backgroundImage' as background
      const objects = fabricCanvas.getObjects();
      const bgImage = objects.find((obj: any) => obj.name === 'backgroundImage');
      if (bgImage) {
        (bgImage as any).isBackgroundImage = true;
        // Ensure backgroundLocked exists, default to true
        if ((bgImage as any).backgroundLocked === undefined) {
          (bgImage as any).backgroundLocked = true;
        }
        console.info('[Undo] Restored background lock state', {
          backgroundLocked: (bgImage as any).backgroundLocked
        });
      }
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
      // Re-tag objects with name='backgroundImage' as background
      const objects = fabricCanvas.getObjects();
      const bgImage = objects.find((obj: any) => obj.name === 'backgroundImage');
      if (bgImage) {
        (bgImage as any).isBackgroundImage = true;
        // Ensure backgroundLocked exists, default to true
        if ((bgImage as any).backgroundLocked === undefined) {
          (bgImage as any).backgroundLocked = true;
        }
        console.info('[Redo] Restored background lock state', {
          backgroundLocked: (bgImage as any).backgroundLocked
        });
      }
      fabricCanvas.renderAll();
    });
  };

  // Use refs to avoid stale closures in keyboard event handlers
  const undoStackRef = useRef(undoStack);
  const redoStackRef = useRef(redoStack);
  const fabricCanvasRef = useRef(fabricCanvas);

  useEffect(() => {
    undoStackRef.current = undoStack;
    redoStackRef.current = redoStack;
    fabricCanvasRef.current = fabricCanvas;
  }, [undoStack, redoStack, fabricCanvas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (fabricCanvasRef.current && undoStackRef.current.length > 1) {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (fabricCanvasRef.current && redoStackRef.current.length > 0) {
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - using refs instead

  return {
    undoStack,
    redoStack,
    saveCanvasState,
    handleUndo,
    handleRedo,
  };
};
