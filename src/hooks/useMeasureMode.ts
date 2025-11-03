import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Line } from "fabric";

interface Position {
  x: number;
  y: number;
}

export const useMeasureMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  onShowDialog: () => void
) => {
  const [measureStart, setMeasureStart] = useState<Position | null>(null);
  const [measureLine, setMeasureLine] = useState<Line | null>(null);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!fabricCanvas || mode !== "measure") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      
      if (!measureStart) {
        setMeasureStart({ x: pointer.x, y: pointer.y });
        
        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: "red",
          strokeWidth: 2,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        
        fabricCanvas.add(line);
        setMeasureLine(line);
      } else {
        const distance = Math.sqrt(
          Math.pow(pointer.x - measureStart.x, 2) + 
          Math.pow(pointer.y - measureStart.y, 2)
        );
        setMeasureDistance(distance);
        onShowDialog();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!measureStart || !measureLine) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      measureLine.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, measureStart, measureLine, onShowDialog]);

  const cancelMeasure = () => {
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    setMeasureStart(null);
    setMeasureLine(null);
    setMeasureDistance(null);
  };

  return {
    measureDistance,
    measureLine,
    cancelMeasure,
  };
};
