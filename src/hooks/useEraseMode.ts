import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Rect, Image as FabricImage } from "fabric";

interface Position {
  x: number;
  y: number;
}

export const useEraseMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  onSaveState: () => void
) => {
  const [eraseStart, setEraseStart] = useState<Position | null>(null);
  const [eraseRect, setEraseRect] = useState<Rect | null>(null);

  const flattenEraseRect = async (rect: Rect) => {
    if (!fabricCanvas) return;
    
    console.info('[Erase] flattenEraseRect called');
    
    // Find the background image object with multiple strategies
    let bg: FabricImage | null = null;
    
    // Strategy 1: Check canvas backgroundImage property
    if (fabricCanvas.backgroundImage && (fabricCanvas.backgroundImage as any).getElement) {
      bg = fabricCanvas.backgroundImage as FabricImage;
      console.info('[Erase] Found bg via canvas.backgroundImage');
    }
    
    // Strategy 2: Find object with isBackgroundImage flag
    if (!bg) {
      const bgObj = fabricCanvas
        .getObjects()
        .find((obj: any) => (obj as any).isBackgroundImage) as FabricImage | undefined;
      if (bgObj) {
        bg = bgObj;
        console.info('[Erase] Found bg via isBackgroundImage flag');
      }
    }
    
    // Strategy 3: Find first image object (likely the background)
    if (!bg) {
      const firstImage = fabricCanvas
        .getObjects()
        .find((obj: any) => obj.type === 'image') as FabricImage | undefined;
      if (firstImage) {
        bg = firstImage;
        console.info('[Erase] Found bg via first image object');
      }
    }

    if (!bg) {
      console.warn('[Erase] No background image found after all strategies');
      fabricCanvas.remove(rect);
      fabricCanvas.renderAll();
      return;
    }

    // Guard: check for invalid dimensions
    const bgWidth = bg.width ?? 0;
    const bgHeight = bg.height ?? 0;
    const bgScaledWidth = bg.getScaledWidth();
    const bgScaledHeight = bg.getScaledHeight();

    if (bgWidth <= 0 || bgHeight <= 0 || bgScaledWidth <= 0 || bgScaledHeight <= 0) {
      console.error('[Erase] Invalid background dimensions', {
        bgWidth,
        bgHeight,
        bgScaledWidth,
        bgScaledHeight
      });
      fabricCanvas.remove(rect);
      fabricCanvas.renderAll();
      return;
    }

    console.info('[Erase] Background dimensions OK', {
      bgWidth,
      bgHeight,
      bgScaledWidth,
      bgScaledHeight,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height
    });
    
    // Create offscreen canvas with the background image
    const offCanvas = document.createElement('canvas');
    offCanvas.width = bgWidth;
    offCanvas.height = bgHeight;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;
    
    const bgElement = bg.getElement();
    ctx.drawImage(bgElement, 0, 0);
    
    const bgLeft = bg.left ?? 0;
    const bgTop = bg.top ?? 0;
    const bgScaleX = bg.scaleX ?? 1;
    const bgScaleY = bg.scaleY ?? 1;
    
    // Calculate erase region in background image coordinates
    const x = Math.max(0, Math.round((rect.left! - bgLeft) / bgScaleX));
    const y = Math.max(0, Math.round((rect.top! - bgTop) / bgScaleY));
    const w = Math.max(0, Math.round((rect.width! * (rect.scaleX ?? 1)) / bgScaleX));
    const h = Math.max(0, Math.round((rect.height! * (rect.scaleY ?? 1)) / bgScaleY));
    
    // Fill erase region with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    
    // Generate new image data and update the existing background IN-PLACE
    const newDataUrl = offCanvas.toDataURL('image/png');
    const element = bg.getElement() as HTMLImageElement;
    
    element.onload = () => {
      console.info('[Erase] Background image updated in-place');
      bg.set({ dirty: true });
      fabricCanvas.renderAll();
      onSaveState();
    };
    
    element.onerror = (err) => {
      console.error('[Erase] Failed to load new image data', err);
    };
    
    element.src = newDataUrl;

    // Remove the erase rectangle
    fabricCanvas.remove(rect);
    fabricCanvas.requestRenderAll();
  };

  useEffect(() => {
    if (!fabricCanvas || mode !== "erase") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Allow touch and left-click; ignore right/middle clicks
      if (typeof e?.button === "number" && e.button !== 0) return;

      const target = opt.target as any;

      // If we clicked the background, treat it like empty space (start rectangle erase)
      if (target && target.isBackgroundImage) {
        const pointer = fabricCanvas.getPointer(opt.e);
        setEraseStart({ x: pointer.x, y: pointer.y });
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(100, 149, 237, 0.3)',
          stroke: 'blue',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(rect);
        setEraseRect(rect);
        return;
      }

      // Check if clicking on a symbol/object (not background)
      if (target) {
        // Delete the symbol immediately
        fabricCanvas.remove(target);
        fabricCanvas.renderAll();
        onSaveState();
        return; // Don't start rectangle erase
      }

      // Empty space - start rectangle erase
      const pointer = fabricCanvas.getPointer(opt.e);
      setEraseStart({ x: pointer.x, y: pointer.y });
      
      const rect = new Rect({
        left: Math.round(pointer.x),
        top: Math.round(pointer.y),
        width: 0,
        height: 0,
        fill: "rgba(255, 0, 0, 0.1)",
        stroke: "#ff0000",
        strokeWidth: 2,
        opacity: 1,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      
      fabricCanvas.add(rect);
      setEraseRect(rect);
    };

    const handleMouseMove = (opt: any) => {
      if (!eraseStart || !eraseRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - eraseStart.x;
      const height = pointer.y - eraseStart.y;
      
      eraseRect.set({
        width: Math.round(Math.abs(width)),
        height: Math.round(Math.abs(height)),
        left: Math.round(width < 0 ? pointer.x : eraseStart.x),
        top: Math.round(height < 0 ? pointer.y : eraseStart.y),
      });
      
      fabricCanvas.renderAll();
    };

    const handleMouseUp = async () => {
      if (!eraseStart || !eraseRect) return;
      
      const width = Math.abs((eraseRect.width ?? 0) * (eraseRect.scaleX ?? 1));
      const height = Math.abs((eraseRect.height ?? 0) * (eraseRect.scaleY ?? 1));
      
      // If the rectangle is too small (just a click, not a drag), remove it without erasing
      if (width < 3 || height < 3) {
        fabricCanvas.remove(eraseRect);
        setEraseStart(null);
        setEraseRect(null);
        fabricCanvas.renderAll();
        return;
      }
      
      const left = Math.round(eraseRect.left ?? 0);
      const top = Math.round(eraseRect.top ?? 0);
      
      eraseRect.set({
        left,
        top,
        width: Math.round(width),
        height: Math.round(height),
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      });
      
      // Store reference before clearing state
      const rectToFlatten = eraseRect;
      setEraseStart(null);
      setEraseRect(null);
      
      // Flatten and remove the rectangle
      await flattenEraseRect(rectToFlatten);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && eraseRect) {
        fabricCanvas.remove(eraseRect);
        setEraseStart(null);
        setEraseRect(null);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, eraseStart, eraseRect, onSaveState]);

  return null;
};
