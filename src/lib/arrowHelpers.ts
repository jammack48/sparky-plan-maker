import { Line, Polygon, Group, FabricText } from "fabric";

interface ArrowOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  distanceText: string;
  fontSize?: number;
}

export function createArrowLine(options: ArrowOptions): Group {
  const { x1, y1, x2, y2, color, strokeWidth, distanceText, fontSize = 16 } = options;

  // Main line
  const line = new Line([x1, y1, x2, y2], {
    stroke: color,
    strokeWidth: strokeWidth,
    selectable: false,
    evented: false,
  });

  // Calculate unit direction vector from start to end
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLength = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / lineLength;
  const uy = dy / lineLength;

  const arrowSize = 10 + strokeWidth;
  const arrowLength = arrowSize;
  const baseWidth = arrowSize * 0.8;

  // Perpendicular vector for arrow base
  const vx = -uy;
  const vy = ux;

  // Start arrowhead (pointing OUTWARD from the measured span)
  const startTipX = x1 - ux * arrowLength;
  const startTipY = y1 - uy * arrowLength;
  const startBaseCenterX = x1 + ux * (arrowLength * 0.2);
  const startBaseCenterY = y1 + uy * (arrowLength * 0.2);

  const startArrow = new Polygon(
    [
      { x: startTipX, y: startTipY },
      {
        x: startBaseCenterX + vx * (baseWidth / 2),
        y: startBaseCenterY + vy * (baseWidth / 2),
      },
      {
        x: startBaseCenterX - vx * (baseWidth / 2),
        y: startBaseCenterY - vy * (baseWidth / 2),
      },
    ],
    {
      fill: color,
      selectable: false,
      evented: false,
      originX: "center",
      originY: "center",
    }
  );

  // End arrowhead (pointing OUTWARD from the measured span)
  const endTipX = x2 + ux * arrowLength;
  const endTipY = y2 + uy * arrowLength;
  const endBaseCenterX = x2 - ux * (arrowLength * 0.2);
  const endBaseCenterY = y2 - uy * (arrowLength * 0.2);

  const endArrow = new Polygon(
    [
      { x: endTipX, y: endTipY },
      {
        x: endBaseCenterX + vx * (baseWidth / 2),
        y: endBaseCenterY + vy * (baseWidth / 2),
      },
      {
        x: endBaseCenterX - vx * (baseWidth / 2),
        y: endBaseCenterY - vy * (baseWidth / 2),
      },
    ],
    {
      fill: color,
      selectable: false,
      evented: false,
      originX: "center",
      originY: "center",
    }
  );

  // Distance label at midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const label = new FabricText(distanceText, {
    left: midX,
    top: midY - 20,
    fontSize: fontSize,
    fill: '#000000',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // Group all elements
  const group = new Group([line, startArrow, endArrow, label], {
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
  });

  // Mark as distance measurement for identification
  (group as any).measurementType = 'distance';

  return group;
}

// Calculate distance and format as text
export function formatDistance(pixelDistance: number, scale: number): string {
  // scale is px/mm
  const mmPerPx = 1 / scale;
  const distanceMm = pixelDistance * mmPerPx;
  const distanceM = distanceMm / 1000;

  if (distanceM >= 1) {
    return `${distanceM.toFixed(2)} m`;
  } else {
    return `${distanceMm.toFixed(0)} mm`;
  }
}
