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
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;

      let finalX = opt.e.offsetX;
      let finalY = opt.e.offsetY;

      // Snap to screen-anchored grid if Ctrl/Meta is held
      if (showGrid && scale && (opt.e.ctrlKey || opt.e.metaKey)) {
        const zoom = vpt[0]; // Assuming uniform zoom
        const baseSpacing = parseFloat(gridSize) * scale * zoom;
        const stepPx = baseSpacing / 2;
        if (stepPx > 0) {
          finalX = Math.round(finalX / stepPx) * stepPx;
          finalY = Math.round(finalY / stepPx) * stepPx;
        }
      }

      // Convert screen coordinates to world coordinates
      const xWorld = (finalX - vpt[4]) / vpt[0];
      const yWorld = (finalY - vpt[5]) / vpt[3];
      
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      
      previewSymbol = createSymbol(selectedSymbol, xWorld, yWorld);
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
      if (opt.e.button !== 0 && opt.e.type !== 'touchstart') return;
      
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;

      let finalX = opt.e.offsetX;
      let finalY = opt.e.offsetY;

      // For touch events, calculate offset from touch position
      if (opt.e.type === 'touchstart' && opt.e.touches && opt.e.touches.length > 0) {
        const rect = fabricCanvas.upperCanvasEl.getBoundingClientRect();
        finalX = opt.e.touches[0].clientX - rect.left;
        finalY = opt.e.touches[0].clientY - rect.top;
      }

      // Snap to screen-anchored grid if Ctrl/Meta is held
      if (showGrid && scale && (opt.e.ctrlKey || opt.e.metaKey)) {
        const zoom = vpt[0];
        const baseSpacing = parseFloat(gridSize) * scale * zoom;
        const stepPx = baseSpacing / 2;
        if (stepPx > 0) {
          finalX = Math.round(finalX / stepPx) * stepPx;
          finalY = Math.round(finalY / stepPx) * stepPx;
        }
      }

      // Convert screen coordinates to world coordinates
      const xWorld = (finalX - vpt[4]) / vpt[0];
      const yWorld = (finalY - vpt[5]) / vpt[3];
      
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
        previewSymbol = null;
      }
      
      const symbol = createSymbol(selectedSymbol, xWorld, yWorld);
      if (symbol) {
        fabricCanvas.add(symbol);
        fabricCanvas.setActiveObject(symbol);
        fabricCanvas.renderAll();
        onSaveState();
        onSymbolPlaced?.(selectedSymbol);
        const snapStatus = (showGrid && scale && (opt.e.ctrlKey || opt.e.metaKey)) ? " (snapped)" : "";
        toast.success(`${selectedSymbol} placed${snapStatus}`);
      }
    };

    const handleTouchMove = (opt: any) => {
      if (opt.e.type !== 'touchmove' || !opt.e.touches || opt.e.touches.length === 0) return;
      
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;

      const rect = fabricCanvas.upperCanvasEl.getBoundingClientRect();
      let finalX = opt.e.touches[0].clientX - rect.left;
      let finalY = opt.e.touches[0].clientY - rect.top;

      // Convert screen coordinates to world coordinates
      const xWorld = (finalX - vpt[4]) / vpt[0];
      const yWorld = (finalY - vpt[5]) / vpt[3];
      
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      
      previewSymbol = createSymbol(selectedSymbol, xWorld, yWorld);
      if (previewSymbol) {
        previewSymbol.opacity = 0.5;
        previewSymbol.selectable = false;
        previewSymbol.evented = false;
        (previewSymbol as any).isPreview = true;
        fabricCanvas.add(previewSymbol);
        fabricCanvas.renderAll();
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
    fabricCanvas.on("mouse:move", handleTouchMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, selectedSymbol, scale, showGrid, gridSize, bgScale, onSymbolPlaced, onSymbolDeselect, createSymbol, onSaveState, setMode]);
};
