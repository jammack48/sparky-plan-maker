import { Line, Triangle, Group, FabricText } from "fabric";

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

  // Calculate angle
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  const arrowSize = 10 + strokeWidth;

  // Start arrowhead (pointing outward/left)
  const startArrow = new Triangle({
    left: x1,
    top: y1,
    width: arrowSize,
    height: arrowSize,
    fill: color,
    angle: angle - 90,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // End arrowhead (pointing outward/right)
  const endArrow = new Triangle({
    left: x2,
    top: y2,
    width: arrowSize,
    height: arrowSize,
    fill: color,
    angle: angle + 90,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

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
