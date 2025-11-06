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

    console.info("[DRAW] activate", { selectedSymbol });

    // Freehand drawing
    if (selectedSymbol === "freehand") {
      // Enable drawing mode
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = 'crosshair';

      const brush = (fabricCanvas as any).freeDrawingBrush;
      console.info("[DRAW] brush", { hasBrush: !!brush });
      if (brush) {
        brush.color = symbolColor;
        brush.width = symbolThickness;
        console.info("[DRAW] brush-config", { color: symbolColor, width: symbolThickness });
      }

      const handlePath = () => {
        console.info("[DRAW] path-created");
        onSymbolPlaced?.("freehand");
        onSaveState();
      };

      const logDown = (e: any) => console.info('[DRAW] freehand mousedown', { x: e.e?.offsetX, y: e.e?.offsetY });
      const logMove = (e: any) => console.info('[DRAW] freehand mousemove', { x: e.e?.offsetX, y: e.e?.offsetY });
      const logUp = () => console.info('[DRAW] freehand mouseup');

      fabricCanvas.on("path:created", handlePath);
      fabricCanvas.on('mouse:down', logDown);
      fabricCanvas.on('mouse:move', logMove);
      fabricCanvas.on('mouse:up', logUp);

      return () => {
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.off("path:created", handlePath);
        fabricCanvas.off('mouse:down', logDown);
        fabricCanvas.off('mouse:move', logMove);
        fabricCanvas.off('mouse:up', logUp);
        console.info("[DRAW] deactivate freehand");
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
      console.info("[DRAW] mousedown", { pointer });
      setIsDrawing(true);
      setStartPoint(pointer);
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawing || !startPoint) return;
      const e = opt.e as MouseEvent;
      const pointer = getPointer(e);
      console.info("[DRAW] mousemove", { startPoint, pointer });

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
      console.info("[DRAW] mouseup");

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
      console.info("[DRAW] deactivate shape");
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
