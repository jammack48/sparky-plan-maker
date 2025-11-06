import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Rect } from "fabric";

interface Position {
  x: number;
  y: number;
}

export const useCropMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  onShowDialog: () => void
) => {
  const [cropStart, setCropStart] = useState<Position | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!fabricCanvas || mode !== "crop") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";
    (fabricCanvas as any).skipTargetFind = true;
    fabricCanvas.discardActiveObject?.();
    fabricCanvas.requestRenderAll();

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Allow touch and left-click; ignore right/middle clicks
      if (typeof e?.button === "number" && e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      
      if (!cropStart) {
        setCropStart({ x: pointer.x, y: pointer.y });
        
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "rgba(0, 123, 255, 0.1)",
          stroke: "blue",
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        
        fabricCanvas.add(rect);
        setCropRect(rect);
      } else {
        onShowDialog();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!cropStart || !cropRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - cropStart.x;
      const height = pointer.y - cropStart.y;
      
      cropRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : cropStart.x,
        top: height < 0 ? pointer.y : cropStart.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      (fabricCanvas as any).skipTargetFind = false;
      fabricCanvas.selection = true;
      fabricCanvas.requestRenderAll();
    };
  }, [fabricCanvas, mode, cropStart, cropRect, onShowDialog]);

  const cancelCrop = () => {
    if (cropRect && fabricCanvas) {
      fabricCanvas.remove(cropRect);
    }
    setCropStart(null);
    setCropRect(null);
  };

  return {
    cropRect,
    cancelCrop,
  };
};
