import { useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject, IText } from "fabric";
import { toast } from "sonner";

export const useSymbolPlacement = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  selectedSymbol: string | null,
  showGrid: boolean,
  scale: number | null,
  bgScale: number,
  gridSize: string,
  createSymbol: (type: string, x: number, y: number, isPreview?: boolean) => FabricObject | null,
  onSymbolPlaced: ((symbolId: string) => void) | undefined,
  onSymbolDeselect: (() => void) | undefined,
  onSaveState: () => void,
  setMode: (mode: "none" | "select" | "move" | "crop" | "measure" | "erase" | "place-symbol" | "draw") => void
) => {
  useEffect(() => {
    if (!fabricCanvas || mode !== "place-symbol" || !selectedSymbol) return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "default";
    
    let previewSymbol: FabricObject | null = null;

    const handleMouseMove = (opt: any) => {
      // Avoid showing preview while dragging existing selections/objects
      const isDraggingMouse = (opt.e as any)?.buttons === 1;
      if (isDraggingMouse) {
        if (previewSymbol) {
          fabricCanvas.remove(previewSymbol);
          previewSymbol = null;
          fabricCanvas.requestRenderAll();
        }
        return;
      }

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
      
      // Reuse existing preview, just move it instead of recreating
      if (previewSymbol) {
        previewSymbol.set({ left: xWorld, top: yWorld });
        previewSymbol.setCoords();
        fabricCanvas.requestRenderAll();
      } else {
        // Create preview only once
        previewSymbol = createSymbol(selectedSymbol, xWorld, yWorld, true);
        if (previewSymbol) {
          previewSymbol.selectable = false;
          previewSymbol.evented = false;
          (previewSymbol as any).isPreview = true;
          fabricCanvas.add(previewSymbol);
          fabricCanvas.requestRenderAll();
        }
      }
    };

    const handleMouseDown = (opt: any) => {
      // If clicking on an existing object/selection, don't place; let Fabric move/select
      if (opt.target && !(opt.target as any).isPreview) {
        return;
      }
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
      
      const symbol = createSymbol(selectedSymbol, xWorld, yWorld, false);
      if (symbol) {
        onSaveState();
        fabricCanvas.add(symbol);
        fabricCanvas.renderAll();
        
        // Only increment count after symbol is successfully added
        if (onSymbolPlaced) {
          onSymbolPlaced(selectedSymbol);
        }
        
        // If it's a text label, trigger edit mode and switch to select
        if (selectedSymbol === "text-label" && symbol instanceof IText) {
          const iText = symbol as IText;
          iText.selectable = true;
          iText.evented = true;
          fabricCanvas.selection = true;
          setMode("select");
          setTimeout(() => {
            fabricCanvas.setActiveObject(iText);
            (iText as any).enterEditing?.();
            (iText as any).selectAll?.();
            fabricCanvas.requestRenderAll();
          }, 10);
          // Only deselect symbol after text is placed
          if (onSymbolDeselect) {
            onSymbolDeselect();
          }
        }
        // For other symbols, keep them selected for continuous placement
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
      
      previewSymbol = createSymbol(selectedSymbol, xWorld, yWorld, true);
      if (previewSymbol) {
        previewSymbol.opacity = 0.5;
        previewSymbol.selectable = false;
        previewSymbol.evented = false;
        (previewSymbol as any).isPreview = true;
        fabricCanvas.add(previewSymbol);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleTouchMove);

    return () => {
      if (previewSymbol && fabricCanvas) {
        fabricCanvas.remove(previewSymbol);
        previewSymbol = null;
      }
      if (fabricCanvas) {
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleTouchMove);
      }
    };
  }, [fabricCanvas, mode, selectedSymbol, showGrid, scale, bgScale, gridSize, createSymbol, onSymbolPlaced, onSymbolDeselect, onSaveState, setMode]);
};
