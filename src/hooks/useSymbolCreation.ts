import { Circle, Line, Rect, Group, Path, FabricObject } from "fabric";

export const useSymbolCreation = () => {
  const createSymbol = (type: string, x: number, y: number): FabricObject | null => {
    const size = 6;
    const halfSize = size / 2;
    
    switch (type) {
      case "light": {
        const lightCircle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const lightLine1 = new Line([0, -halfSize, 0, halfSize], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const lightLine2 = new Line([-halfSize, 0, halfSize, 0], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const group = new Group([lightCircle, lightLine1, lightLine2], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "power": {
        const powerRect = new Rect({
          width: size,
          height: size,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          originX: "center",
          originY: "center",
        });
        const powerLine1 = new Line([-2, -2, -2, 2], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const powerLine2 = new Line([2, -2, 2, 2], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const powerGroup = new Group([powerRect, powerLine1, powerLine2], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (powerGroup as any).symbolType = type;
        return powerGroup;
      }
        
      case "switch": {
        const switchLine = new Line([-halfSize, 0, 0, -halfSize], {
          stroke: "#000",
          strokeWidth: 0.6,
        });
        const switchBase = new Circle({
          radius: 0.6,
          fill: "#000",
          left: -halfSize,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const switchGroup = new Group([switchLine, switchBase], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (switchGroup as any).symbolType = type;
        return switchGroup;
      }
        
      case "data": {
        const dataPath = new Path(
          `M 0,${-halfSize} L ${halfSize},0 L 0,${halfSize} L ${-halfSize},0 Z`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const dataGroup = new Group([dataPath], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (dataGroup as any).symbolType = type;
        return dataGroup;
      }
        
      case "smoke": {
        const smokePath = new Path(
          `M 0,${-halfSize} L ${halfSize},${halfSize} L ${-halfSize},${halfSize} Z`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const smokeExclaim = new Path(`M 0,-1 L 0,1 M 0,2 L 0,2.4`, {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const smokeGroup = new Group([smokePath, smokeExclaim], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (smokeGroup as any).symbolType = type;
        return smokeGroup;
      }
        
      case "cable": {
        const cablePath = new Path(
          `M ${-halfSize},0 Q ${-halfSize / 2},-2 0,0 T ${halfSize},0`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const cableGroup = new Group([cablePath], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (cableGroup as any).symbolType = type;
        return cableGroup;
      }
        
      default:
        return null;
    }
  };

  return { createSymbol };
};
