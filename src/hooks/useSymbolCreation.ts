import { Circle, Line, Rect, Group, Path, FabricObject } from "fabric";

export const useSymbolCreation = () => {
  const createSymbol = (type: string, x: number, y: number): FabricObject | null => {
    const size = 6;
    const halfSize = size / 2;
    
    switch (type) {
      case "downlight": {
        // Circle with X
        const circle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const xLine1 = new Line([-halfSize * 0.7, -halfSize * 0.7, halfSize * 0.7, halfSize * 0.7], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const xLine2 = new Line([-halfSize * 0.7, halfSize * 0.7, halfSize * 0.7, -halfSize * 0.7], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const group = new Group([circle, xLine1, xLine2], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
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
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const line = new Line([0, 0, 0, halfSize], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const group = new Group([arc, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "single-switch": {
        // Circle with single diagonal line
        const circle = new Circle({
          radius: halfSize * 0.7,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const line = new Line([-halfSize * 0.5, halfSize * 0.3, halfSize * 0.5, -halfSize * 0.5], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([circle, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "double-switch": {
        // Similar to single but with two elements
        const circle1 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: -halfSize * 0.5,
          top: halfSize * 0.2,
          originX: "center",
          originY: "center",
        });
        const circle2 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: halfSize * 0.5,
          top: -halfSize * 0.2,
          originX: "center",
          originY: "center",
        });
        const line = new Line([-halfSize * 0.8, halfSize * 0.4, halfSize * 0.8, -halfSize * 0.6], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([circle1, circle2, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "triple-switch": {
        // Three elements in a row
        const switch1 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: -halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const switch2 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: 0,
          top: -halfSize * 0.1,
          originX: "center",
          originY: "center",
        });
        const switch3 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const line = new Line([-halfSize * 1.1, halfSize * 0.1, halfSize * 1.1, -halfSize * 0.3], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([switch1, switch2, switch3, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "fan": {
        // Capital F in a circle
        const circle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const fPath = new Path(
          `M ${-halfSize * 0.4},${-halfSize * 0.5} L ${-halfSize * 0.4},${halfSize * 0.5} M ${-halfSize * 0.4},${-halfSize * 0.5} L ${halfSize * 0.3},${-halfSize * 0.5} M ${-halfSize * 0.4},0 L ${halfSize * 0.1},0`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const group = new Group([circle, fPath], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      default:
        return null;
    }
  };

  return { createSymbol };
};
