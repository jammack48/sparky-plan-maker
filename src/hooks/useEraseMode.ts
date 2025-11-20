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
    
    // Support both Fabric backgroundImage and our tagged background image object
    let bg = (fabricCanvas.backgroundImage as FabricImage | null) ?? null;

    if (!bg) {
      const bgObj = fabricCanvas
        .getObjects()
        .find((obj: any) => (obj as any).isBackgroundImage) as FabricImage | undefined;
      if (bgObj) {
        bg = bgObj;
      }
    }

    if (!bg) {
      // No background image found - just clean up the rectangle so it doesn't stay on screen
      fabricCanvas.remove(rect);
      fabricCanvas.renderAll();
      return;
    }
    
    const offCanvas = document.createElement('canvas');
    const bgWidth = bg.width ?? 0;
    const bgHeight = bg.height ?? 0;
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
    
    const x = Math.max(0, Math.round((rect.left! - bgLeft) / bgScaleX));
    const y = Math.max(0, Math.round((rect.top! - bgTop) / bgScaleY));
    const w = Math.max(0, Math.round((rect.width! * (rect.scaleX ?? 1)) / bgScaleX));
    const h = Math.max(0, Math.round((rect.height! * (rect.scaleY ?? 1)) / bgScaleY));
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    
    const newDataUrl = offCanvas.toDataURL('image/png');
    const newImg = await FabricImage.fromURL(newDataUrl);

    // Copy positioning and interaction properties from the existing background image
    newImg.set({
      scaleX: bgScaleX,
      scaleY: bgScaleY,
      left: bgLeft,
      top: bgTop,
      selectable: (bg as any).selectable,
      evented: (bg as any).evented,
      hasControls: (bg as any).hasControls,
      objectCaching: (bg as any).objectCaching,
      hoverCursor: (bg as any).hoverCursor,
      moveCursor: (bg as any).moveCursor,
    });
    (newImg as any).isBackgroundImage = (bg as any).isBackgroundImage;

    // Replace the old background image with the new one and keep it at the back
    if (fabricCanvas.backgroundImage === bg) {
      fabricCanvas.backgroundImage = newImg;
    }
    fabricCanvas.remove(bg);
    fabricCanvas.add(newImg);
    (fabricCanvas as any).sendToBack?.(newImg);

    fabricCanvas.remove(rect);
    fabricCanvas.renderAll();
    onSaveState();
  };

  useEffect(() => {
    if (!fabricCanvas || mode !== "erase") {
      // When leaving erase mode, restore normal selection
      if (fabricCanvas && mode !== "erase") {
        fabricCanvas.selection = true;
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
      return;
    }

    // Clear any active selections when entering erase mode
    fabricCanvas.discardActiveObject();
    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";
    fabricCanvas.renderAll();

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Allow touch and left-click; ignore right/middle clicks
      if (typeof e?.button === "number" && e.button !== 0) return;

      // Check if clicking on a symbol/object (not background)
      const target = opt.target;
      
      // Don't delete background images or very large objects (likely the floorplan)
      if (target && !(target as any).isBackgroundImage) {
        // Additional safety: Don't delete objects that are very large relative to canvas
        // (they're likely the background floorplan)
        const canvasWidth = fabricCanvas.getWidth();
        const canvasHeight = fabricCanvas.getHeight();
        const targetWidth = (target.width ?? 0) * (target.scaleX ?? 1);
        const targetHeight = (target.height ?? 0) * (target.scaleY ?? 1);
        
        // If object takes up more than 50% of canvas area, treat it as background
        const canvasArea = canvasWidth * canvasHeight;
        const targetArea = targetWidth * targetHeight;
        const areaRatio = targetArea / canvasArea;
        
        if (areaRatio > 0.5) {
          console.log("[Erase] Ignoring large object (likely background):", areaRatio);
          return; // Don't delete large objects
        }
        
        // Delete the symbol immediately
        fabricCanvas.remove(target);
        fabricCanvas.renderAll();
        onSaveState();
        return; // Don't start rectangle erase
      }

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
