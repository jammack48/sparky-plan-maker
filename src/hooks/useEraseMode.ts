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
    
    const bg = fabricCanvas.backgroundImage as FabricImage;
    if (!bg) return;
    
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
    newImg.set({
      scaleX: bgScaleX,
      scaleY: bgScaleY,
      left: bgLeft,
      top: bgTop,
    });
    
    fabricCanvas.backgroundImage = newImg;
    fabricCanvas.remove(rect);
    fabricCanvas.renderAll();
    onSaveState();
  };

  useEffect(() => {
    if (!fabricCanvas || mode !== "erase") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Allow touch and left-click; ignore right/middle clicks
      if (typeof e?.button === "number" && e.button !== 0) return;

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
      
      await flattenEraseRect(eraseRect);
      
      setEraseStart(null);
      setEraseRect(null);
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
