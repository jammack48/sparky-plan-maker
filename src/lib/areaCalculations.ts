export interface Point {
  x: number;
  y: number;
}

// Shoelace formula for polygon area calculation
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

// Convert pixel area to square meters
export function pixelAreaToMeters(pixelArea: number, pxPerMm: number): number {
  const mmPerPx = 1 / pxPerMm;
  const areaMm2 = pixelArea * (mmPerPx * mmPerPx);
  const areaM2 = areaMm2 / (1000 * 1000);
  return areaM2;
}

// Calculate volume from area and height
export function calculateVolume(areaM2: number, heightMm: number): number {
  const heightM = heightMm / 1000;
  return areaM2 * heightM;
}

// Calculate polygon centroid for label placement
export function getPolygonCenter(points: Point[]): Point {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

// Check if point is close to another point (for auto-closing)
export function isPointNear(p1: Point, p2: Point, threshold = 20): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}
