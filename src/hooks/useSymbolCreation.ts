import { Circle, Line, Path, Group, FabricObject, FabricText, IText } from "fabric";

export const useSymbolCreation = (
  color: string = "#000000",
  thickness: number = 2,
  transparency: number = 1,
  scale: number = 1
) => {
  const createSymbol = (type: string, x: number, y: number): FabricObject | null => {
    const baseSize = 12 * scale; // Doubled from 6 to 12
    const halfSize = baseSize / 2;
    
    switch (type) {
      case "downlight": {
        // Circle with X inside it (matching icon)
        const xExtent = halfSize * 0.7; // X stays inside the circle
        const circle = new Circle({
          radius: halfSize,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const xLine1 = new Line([-xExtent, -xExtent, xExtent, xExtent], {
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const xLine2 = new Line([xExtent, -xExtent, -xExtent, xExtent], {
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const group = new Group([circle, xLine1, xLine2], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "power-point": {
        // Half circle with vertical line
        const arc = new Path(
          `M ${-halfSize},0 A ${halfSize},${halfSize} 0 0,1 ${halfSize},0`,
          {
            fill: "transparent",
            stroke: color,
            strokeWidth: 0.4 * thickness,
            opacity: transparency,
          }
        );
        const line = new Line([0, 0, 0, halfSize], {
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const group = new Group([arc, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "single-switch": {
        // Circle with single diagonal line
        const circle = new Circle({
          radius: halfSize * 0.7,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const line = new Line([-halfSize * 0.5, halfSize * 0.3, halfSize * 0.5, -halfSize * 0.5], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const group = new Group([circle, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "double-switch": {
        // Similar to single but with two elements
        const circle1 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: -halfSize * 0.5,
          top: halfSize * 0.2,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const circle2 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: halfSize * 0.5,
          top: -halfSize * 0.2,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const line = new Line([-halfSize * 0.8, halfSize * 0.4, halfSize * 0.8, -halfSize * 0.6], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const group = new Group([circle1, circle2, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "triple-switch": {
        // Three elements in a row
        const switch1 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: -halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const switch2 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: 0,
          top: -halfSize * 0.1,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const switch3 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const line = new Line([-halfSize * 1.1, halfSize * 0.1, halfSize * 1.1, -halfSize * 0.3], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const group = new Group([switch1, switch2, switch3, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "fan": {
        // Capital F in a circle
        const circle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const fPath = new Path(
          `M ${-halfSize * 0.4},${-halfSize * 0.5} L ${-halfSize * 0.4},${halfSize * 0.5} M ${-halfSize * 0.4},${-halfSize * 0.5} L ${halfSize * 0.3},${-halfSize * 0.5} M ${-halfSize * 0.4},0 L ${halfSize * 0.1},0`,
          {
            fill: "transparent",
            stroke: color,
            strokeWidth: 0.4 * thickness,
            opacity: transparency,
          }
        );
        const group = new Group([circle, fPath], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "text-label": {
        const text = new IText("Label", {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          fill: color,
          opacity: transparency,
          fontSize: 16 * scale,
          selectable: true,
          editable: true,
          fontFamily: "Arial",
        } as any);
        (text as any).symbolType = type;
        return text as unknown as FabricObject;
      }
      
      default: {
        // Generic placeholder: circle with a question mark for unimplemented symbols
        const circle = new Circle({
          radius: halfSize,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const qText = new FabricText("?", {
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: color,
          opacity: transparency,
          fontSize: 14 * scale,
        });
        const group = new Group([circle, qText], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        return group;
      }
    }
  };

  return { createSymbol };
};
