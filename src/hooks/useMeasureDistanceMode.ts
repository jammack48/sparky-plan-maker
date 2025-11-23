import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Line, Circle } from "fabric";
import { createArrowLine, formatDistance } from "@/lib/arrowHelpers";

interface Position {
  x: number;
  y: number;
}

export const useMeasureDistanceMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  scale: number | null,
  distanceColor: string,
  distanceStrokeWidth: number
) => {
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [previewLine, setPreviewLine] = useState<Line | null>(null);
  const [startCircle, setStartCircle] = useState<Circle | null>(null);

  useEffect(() => {
    if (!fabricCanvas || mode !== "measure-distance" || !scale) {
      // Clean up preview elements when not in distance mode
      if (previewLine && fabricCanvas) {
        fabricCanvas.remove(previewLine);
        setPreviewLine(null);
      }
      if (startCircle && fabricCanvas) {
        fabricCanvas.remove(startCircle);
        setStartCircle(null);
      }
      setStartPoint(null);
      return;
    }

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Allow touch and left-click; ignore right/middle clicks
      if (typeof e?.button === "number" && e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(e);

      if (!startPoint) {
        // First click - set start point
        setStartPoint({ x: pointer.x, y: pointer.y });

        // Create preview circle at start
        const circle = new Circle({
          left: pointer.x - 5,
          top: pointer.y - 5,
          radius: 5,
          fill: distanceColor,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });

        fabricCanvas.add(circle);
        setStartCircle(circle);

        // Create preview line
        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: distanceColor,
          strokeWidth: distanceStrokeWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });

        fabricCanvas.add(line);
        setPreviewLine(line);
      } else {
        // Second click - create permanent arrow measurement
        const pixelDistance = Math.sqrt(
          Math.pow(pointer.x - startPoint.x, 2) +
          Math.pow(pointer.y - startPoint.y, 2)
        );

        const distanceText = formatDistance(pixelDistance, scale);

        const arrowGroup = createArrowLine({
          x1: startPoint.x,
          y1: startPoint.y,
          x2: pointer.x,
          y2: pointer.y,
          color: distanceColor,
          strokeWidth: distanceStrokeWidth,
          distanceText: distanceText,
        });

        fabricCanvas.add(arrowGroup);

        // Clean up preview elements
        if (previewLine) fabricCanvas.remove(previewLine);
        if (startCircle) fabricCanvas.remove(startCircle);

        setStartPoint(null);
        setPreviewLine(null);
        setStartCircle(null);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!startPoint || !previewLine) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      let x2 = pointer.x;
      let y2 = pointer.y;

      // Snap to horizontal or vertical when Control key is pressed
      if (opt.e.ctrlKey) {
        const dx = Math.abs(x2 - startPoint.x);
        const dy = Math.abs(y2 - startPoint.y);

        // Snap to whichever axis has greater distance
        if (dx > dy) {
          y2 = startPoint.y; // Snap to horizontal
        } else {
          x2 = startPoint.x; // Snap to vertical
        }
      }

      previewLine.set({
        x2: x2,
        y2: y2,
      });

      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, startPoint, scale, distanceColor, distanceStrokeWidth, previewLine, startCircle]);

  const cancelDistance = () => {
    if (previewLine && fabricCanvas) {
      fabricCanvas.remove(previewLine);
    }
    if (startCircle && fabricCanvas) {
      fabricCanvas.remove(startCircle);
    }
    setStartPoint(null);
    setPreviewLine(null);
    setStartCircle(null);
  };

  return {
    isDrawing: startPoint !== null,
    cancelDistance,
  };
};
