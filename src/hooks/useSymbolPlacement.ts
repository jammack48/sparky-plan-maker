import { useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";

export const useSymbolPlacement = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  selectedSymbol: string | null,
  showGrid: boolean,
  scale: number | null,
  bgScale: number,
  gridSize: string,
  createSymbol: (type: string, x: number, y: number) => FabricObject | null,
  onSymbolPlaced: ((symbolId: string) => void) | undefined,
  onSymbolDeselect: (() => void) | undefined,
  onSaveState: () => void,
  setMode: (mode: "select" | "crop" | "measure" | "erase" | "place-symbol") => void
) => {
  useEffect(() => {
    if (!fabricCanvas || mode !== "place-symbol" || !selectedSymbol) return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "none";
    
    let previewSymbol: FabricObject | null = null;

    const handleMouseMove = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);
      let x = pointer.x;
      let y = pointer.y;

      let baseSpacing = null as number | null;
      if (showGrid && scale && bgScale) {
        baseSpacing = parseFloat(gridSize) * (scale ?? 1);
      }
      console.log("[PREVIEW] Grid snap values:", {
        gridSize: parseFloat(gridSize),
        scale,
        bgScale,
        baseSpacing,
        pointerX: pointer.x,
        pointerY: pointer.y,
        ctrlHeld: opt.e.ctrlKey || opt.e.metaKey,
      });

      if (baseSpacing && baseSpacing > 0 && (opt.e.ctrlKey || opt.e.metaKey)) {
        const beforeX = x;
        const beforeY = y;
        x = Math.round(pointer.x / baseSpacing) * baseSpacing;
        y = Math.round(pointer.y / baseSpacing) * baseSpacing;
        console.log("[PREVIEW] Snapped:", {
          before: { x: beforeX, y: beforeY },
          after: { x, y },
          delta: { x: x - beforeX, y: y - beforeY },
        });
      }
      
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      
      previewSymbol = createSymbol(selectedSymbol, x, y);
      if (previewSymbol) {
        previewSymbol.opacity = 0.5;
        previewSymbol.selectable = false;
        previewSymbol.evented = false;
        (previewSymbol as any).isPreview = true;
        fabricCanvas.add(previewSymbol);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseDown = (opt: any) => {
      if (opt.e.button !== 0) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      let left = pointer.x;
      let top = pointer.y;
      const baseSpacing = showGrid && scale && bgScale ? parseFloat(gridSize) * (scale ?? 1) : null;
      console.log("[PLACE] Symbol placement:", {
        gridSize: parseFloat(gridSize),
        scale,
        bgScale,
        baseSpacing,
        pointerX: pointer.x,
        pointerY: pointer.y,
        ctrlHeld: opt.e.ctrlKey || opt.e.metaKey,
        showGrid,
      });
      if (baseSpacing && baseSpacing > 0 && (opt.e.ctrlKey || opt.e.metaKey)) {
        const beforeLeft = left;
        const beforeTop = top;
        left = Math.round(pointer.x / baseSpacing) * baseSpacing;
        top = Math.round(pointer.y / baseSpacing) * baseSpacing;
        console.log("[PLACE] Snapped:", {
          before: { left: beforeLeft, top: beforeTop },
          after: { left, top },
          delta: { left: left - beforeLeft, top: top - beforeTop },
        });
      }
      
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
        previewSymbol = null;
      }
      
      const symbol = createSymbol(selectedSymbol, left, top);
      if (symbol) {
        fabricCanvas.add(symbol);
        fabricCanvas.setActiveObject(symbol);
        fabricCanvas.renderAll();
        onSaveState();
        onSymbolPlaced?.(selectedSymbol);
        const snapStatus = (showGrid && scale && bgScale && (opt.e.ctrlKey || opt.e.metaKey)) ? " (snapped)" : "";
        toast.success(`${selectedSymbol} placed${snapStatus}`);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewSymbol) {
          fabricCanvas.remove(previewSymbol);
          previewSymbol = null;
        }
        onSymbolDeselect?.();
        setMode("select");
        toast.info("Symbol placement cancelled");
      }
    };

    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:down", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:down", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, selectedSymbol, scale, showGrid, gridSize, bgScale, onSymbolPlaced, onSymbolDeselect, createSymbol, onSaveState, setMode]);
};
