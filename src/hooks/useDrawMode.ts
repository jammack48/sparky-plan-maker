import { useEffect } from "react";
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
      console.info("[DRAW] brush", { hasBrush: !!brush, color: brush?.color, width: brush?.width });
      if (brush) {
        brush.color = symbolColor;
        brush.width = symbolThickness;
        console.info("[DRAW] brush-config applied", { color: symbolColor, width: symbolThickness });
      }

      const handlePath = () => {
        console.info("[DRAW] path-created ✓");
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

    // Shape drawing (line, rectangle, circle) - using closure state to prevent re-renders
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;

    let localIsDrawing = false;
    let localStartPoint: { x: number; y: number } | null = null;
    let localTempObject: FabricObject | null = null;

    const getPointer = (e: MouseEvent) => {
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return { x: 0, y: 0 };
      return {
        x: (e.offsetX - vpt[4]) / vpt[0],
        y: (e.offsetY - vpt[5]) / vpt[3]
      };
    };

    const snapToAngle = (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Snap to 45° increments (0°, 45°, 90°, 135°, 180°, -135°, -90°, -45°)
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      
      return {
        x: start.x + distance * Math.cos(snapAngle),
        y: start.y + distance * Math.sin(snapAngle)
      };
    };

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button !== 0) return;
      const pointer = getPointer(e);
      console.info("[DRAW] shape mousedown", { pointer, tool: selectedSymbol });
      localIsDrawing = true;
      localStartPoint = pointer;
    };

    const handleMouseMove = (opt: any) => {
      if (!localIsDrawing || !localStartPoint) return;
      const e = opt.e as MouseEvent;
      let pointer = getPointer(e);
      
      // Snap to angles if Ctrl is pressed (for line tool)
      if (selectedSymbol === "line" && e.ctrlKey) {
        pointer = snapToAngle(localStartPoint, pointer);
      }

      if (localTempObject) {
        fabricCanvas.remove(localTempObject);
      }

      let newObject: FabricObject | null = null;

      if (selectedSymbol === "line") {
        newObject = new Line([localStartPoint.x, localStartPoint.y, pointer.x, pointer.y], {
          stroke: symbolColor,
          strokeWidth: symbolThickness,
          opacity: symbolTransparency,
          selectable: false,
          evented: false,
        });
      } else if (selectedSymbol === "rectangle") {
        let width = pointer.x - localStartPoint.x;
        let height = pointer.y - localStartPoint.y;
        
        // Make it a square if Ctrl is pressed
        if (e.ctrlKey) {
          const size = Math.max(Math.abs(width), Math.abs(height));
          width = Math.sign(width || 1) * size;
          height = Math.sign(height || 1) * size;
        }
        
        newObject = new Rect({
          left: localStartPoint.x,
          top: localStartPoint.y,
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
          Math.pow(pointer.x - localStartPoint.x, 2) + Math.pow(pointer.y - localStartPoint.y, 2)
        );
        newObject = new Circle({
          left: localStartPoint.x,
          top: localStartPoint.y,
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
        localTempObject = newObject;
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = (opt: any) => {
      if (!localIsDrawing) return;
      console.info("[DRAW] shape mouseup", { hadTemp: !!localTempObject, hadStart: !!localStartPoint });

      localIsDrawing = false;
      
      const e = opt.e as MouseEvent;
      let pointer = getPointer(e);

      // Snap to angles if Ctrl is pressed (for line tool)
      if (selectedSymbol === "line" && e.ctrlKey && localStartPoint) {
        pointer = snapToAngle(localStartPoint, pointer);
      }

      if (localTempObject) {
        fabricCanvas.remove(localTempObject);
        localTempObject = null;
      }

      if (!localStartPoint) return;

      // Add final object
      let finalObject: FabricObject | null = null;

      if (selectedSymbol === "line") {
        finalObject = new Line(
          [localStartPoint.x, localStartPoint.y, pointer.x, pointer.y],
          {
            stroke: symbolColor,
            strokeWidth: symbolThickness,
            opacity: symbolTransparency,
          }
        );
      } else if (selectedSymbol === "rectangle") {
        let width = pointer.x - localStartPoint.x;
        let height = pointer.y - localStartPoint.y;
        
        // Make it a square if Ctrl is pressed
        if (e.ctrlKey) {
          const size = Math.max(Math.abs(width), Math.abs(height));
          width = Math.sign(width || 1) * size;
          height = Math.sign(height || 1) * size;
        }
        
        const left = width < 0 ? pointer.x : localStartPoint.x;
        const top = height < 0 ? pointer.y : localStartPoint.y;
        finalObject = new Rect({
          left: left,
          top: top,
          width: Math.abs(width),
          height: Math.abs(height),
          fill: "transparent",
          stroke: symbolColor,
          strokeWidth: symbolThickness,
          opacity: symbolTransparency,
        });
      } else if (selectedSymbol === "circle") {
        const radius = Math.sqrt(
          Math.pow(pointer.x - localStartPoint.x, 2) + Math.pow(pointer.y - localStartPoint.y, 2)
        );
        finalObject = new Circle({
          left: localStartPoint.x,
          top: localStartPoint.y,
          radius: radius,
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
        console.info("[DRAW] shape placed ✓", { type: selectedSymbol });
      }

      localStartPoint = null;
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      if (localTempObject) {
        fabricCanvas.remove(localTempObject);
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
    onSaveState,
    onSymbolPlaced,
  ]);
};
