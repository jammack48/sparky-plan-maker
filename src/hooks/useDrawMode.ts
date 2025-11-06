import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, Circle, FabricObject } from "fabric";

export const useDrawMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  selectedSymbol: string | null,
  symbolColor: string,
  symbolThickness: number,
  symbolTransparency: number,
  onSaveState: () => void,
  onSymbolPlaced?: (symbolId: string) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempObject, setTempObject] = useState<FabricObject | null>(null);

  useEffect(() => {
    if (!fabricCanvas || mode !== "draw" || !selectedSymbol) return;

    // Freehand drawing
    if (selectedSymbol === "freehand") {
      fabricCanvas.isDrawingMode = true;
      const brush = (fabricCanvas as any).freeDrawingBrush;
      if (brush) {
        brush.color = symbolColor;
        brush.width = symbolThickness;
      }
      
      const handlePath = () => {
        onSymbolPlaced?.("freehand");
        onSaveState();
      };
      
      fabricCanvas.on("path:created", handlePath);
      
      return () => {
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.off("path:created", handlePath);
      };
    }

    // Shape drawing (line, rectangle, circle)
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;

    const getPointer = (e: MouseEvent) => {
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return { x: 0, y: 0 };
      return {
        x: (e.offsetX - vpt[4]) / vpt[0],
        y: (e.offsetY - vpt[5]) / vpt[3]
      };
    };

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button !== 0) return;

      const pointer = getPointer(e);
      setIsDrawing(true);
      setStartPoint(pointer);
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawing || !startPoint) return;

      const e = opt.e as MouseEvent;
      const pointer = getPointer(e);

      if (tempObject) {
        fabricCanvas.remove(tempObject);
      }

      let newObject: FabricObject | null = null;

      if (selectedSymbol === "line") {
        newObject = new Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
          stroke: symbolColor,
          strokeWidth: symbolThickness,
          opacity: symbolTransparency,
          selectable: false,
          evented: false,
        });
      } else if (selectedSymbol === "rectangle") {
        const width = pointer.x - startPoint.x;
        const height = pointer.y - startPoint.y;
        newObject = new Rect({
          left: startPoint.x,
          top: startPoint.y,
          width: Math.abs(width),
          height: Math.abs(height),
          fill: "transparent",
          stroke: symbolColor,
          strokeWidth: symbolThickness,
          opacity: symbolTransparency,
          selectable: false,
          evented: false,
        });
        if (width < 0) newObject.set({ left: pointer.x });
        if (height < 0) newObject.set({ top: pointer.y });
      } else if (selectedSymbol === "circle") {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)
        );
        newObject = new Circle({
          left: startPoint.x,
          top: startPoint.y,
          radius: radius,
          fill: "transparent",
          stroke: symbolColor,
          strokeWidth: symbolThickness,
          opacity: symbolTransparency,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });
      }

      if (newObject) {
        fabricCanvas.add(newObject);
        setTempObject(newObject);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;

      setIsDrawing(false);
      setStartPoint(null);

      if (tempObject) {
        fabricCanvas.remove(tempObject);
        setTempObject(null);

        // Add final object
        let finalObject: FabricObject | null = null;

        if (selectedSymbol === "line" && tempObject instanceof Line) {
          finalObject = new Line(
            [tempObject.x1!, tempObject.y1!, tempObject.x2!, tempObject.y2!],
            {
              stroke: symbolColor,
              strokeWidth: symbolThickness,
              opacity: symbolTransparency,
            }
          );
        } else if (selectedSymbol === "rectangle" && tempObject instanceof Rect) {
          finalObject = new Rect({
            left: tempObject.left,
            top: tempObject.top,
            width: tempObject.width,
            height: tempObject.height,
            fill: "transparent",
            stroke: symbolColor,
            strokeWidth: symbolThickness,
            opacity: symbolTransparency,
          });
        } else if (selectedSymbol === "circle" && tempObject instanceof Circle) {
          finalObject = new Circle({
            left: tempObject.left,
            top: tempObject.top,
            radius: tempObject.radius,
            fill: "transparent",
            stroke: symbolColor,
            strokeWidth: symbolThickness,
            opacity: symbolTransparency,
            originX: "center",
            originY: "center",
          });
        }

        if (finalObject) {
          (finalObject as any).symbolType = selectedSymbol;
          fabricCanvas.add(finalObject);
          fabricCanvas.renderAll();
          onSaveState();
          onSymbolPlaced?.(selectedSymbol);
        }
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      if (tempObject) {
        fabricCanvas.remove(tempObject);
      }
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [
    fabricCanvas,
    mode,
    selectedSymbol,
    symbolColor,
    symbolThickness,
    symbolTransparency,
    isDrawing,
    startPoint,
    tempObject,
    onSaveState,
    onSymbolPlaced,
  ]);
};
