import { useEffect, useState, useRef } from "react";
import { Canvas as FabricCanvas, Polygon, FabricText, Circle, Polyline } from "fabric";
import { calculatePolygonArea, pixelAreaToMeters, calculateVolume, getPolygonCenter, isPointNear } from "@/lib/areaCalculations";
import { toast } from "sonner";

interface Point {
  x: number;
  y: number;
}

interface AreaMeasurement {
  id: string;
  polygon: Polygon;
  label: FabricText;
  area: number;
  volume?: number;
  color: string;
}

export const useMeasureAreaMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  scale: number | null,
  areaColor: string,
  areaOpacity: number,
  heightValue: number | null
) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<AreaMeasurement[]>([]);
  
  // Use refs for values that event handlers need immediate access to
  const pointsRef = useRef<Point[]>([]);
  const previewLineRef = useRef<Polyline | null>(null);
  const previewCirclesRef = useRef<Circle[]>([]);
  const dragPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragCircleRef = useRef<Circle | null>(null);

  // Sync points ref with state
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!fabricCanvas || (mode !== "measure-area" && mode !== "measure-volume")) {
      // Clean up preview elements when not in area mode
      if (previewLineRef.current && fabricCanvas) {
        fabricCanvas.remove(previewLineRef.current);
        previewLineRef.current = null;
      }
      previewCirclesRef.current.forEach(circle => fabricCanvas?.remove(circle));
      previewCirclesRef.current = [];
      setPoints([]);
      return;
    }

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    // Lock background to prevent movement during measurement
    const objects = fabricCanvas.getObjects();
    const background = objects.find((obj: any) => obj.isBackgroundImage || obj.name === 'backgroundImage');
    if (background) {
      background.selectable = false;
      background.evented = false;
    }

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      if (typeof e?.button === "number" && e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(e);
      dragPointRef.current = { x: pointer.x, y: pointer.y };

      // Create preview circle at drag start
      const circle = new Circle({
        left: pointer.x - 5,
        top: pointer.y - 5,
        radius: 5,
        fill: areaColor,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      dragCircleRef.current = circle;
      fabricCanvas.add(circle);
      fabricCanvas.renderAll();
    };

    const handleMouseUp = (opt: any) => {
      if (!dragPointRef.current || !dragCircleRef.current) return;

      const e = opt.e;
      const pointer = fabricCanvas.getPointer(e);
      const finalPoint = { x: pointer.x, y: pointer.y };

      const currentPoints = pointsRef.current;
      
      // Check if clicking near first point (close polygon)
      if (currentPoints.length >= 3 && isPointNear(finalPoint, currentPoints[0], 30)) {
        fabricCanvas.remove(dragCircleRef.current);
        dragPointRef.current = null;
        dragCircleRef.current = null;
        completePolygon();
        return;
      }

      // Commit the point - add circle to preview circles ref
      previewCirclesRef.current = [...previewCirclesRef.current, dragCircleRef.current!];
      setPoints(prev => [...prev, finalPoint]);
      
      dragPointRef.current = null;
      dragCircleRef.current = null;
    };

    const handleMouseMove = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);

      // Update dragging point position
      if (dragPointRef.current && dragCircleRef.current) {
        dragCircleRef.current.set({
          left: pointer.x - 5,
          top: pointer.y - 5,
        });
      }

      const currentPoints = pointsRef.current;
      
      // Update preview line only if we have committed points
      if (currentPoints.length === 0 && !dragPointRef.current) return;

      // Remove old preview line
      if (previewLineRef.current) {
        fabricCanvas.remove(previewLineRef.current);
      }

      const linePoints = [...currentPoints, { x: pointer.x, y: pointer.y }];

      const line = new Polyline(linePoints, {
        stroke: areaColor,
        strokeWidth: 2,
        fill: 'transparent',
        selectable: false,
        evented: false,
        excludeFromExport: true,
        strokeDashArray: [5, 5],
      });

      fabricCanvas.add(line);
      previewLineRef.current = line;
      fabricCanvas.renderAll();
    };

    const completePolygon = () => {
      const currentPoints = pointsRef.current;
      if (currentPoints.length < 3) return;
      
      if (!scale) {
        toast.error("Please set a scale first using 'Set Scale' in the Measure menu");
        return;
      }

      // Calculate area
      const pixelArea = calculatePolygonArea(currentPoints);
      const areaM2 = pixelAreaToMeters(pixelArea, scale);
      const volume = heightValue ? calculateVolume(areaM2, heightValue) : null;

      // Create polygon with opacity
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const fillColor = hexToRgba(areaColor, areaOpacity);
      const strokeColor = areaColor;

      const polygon = new Polygon(currentPoints, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        selectable: true,
        hasControls: false,
        hasBorders: true,
        objectCaching: false,
      });

      // Create label
      const center = getPolygonCenter(currentPoints);
      const labelText = volume 
        ? `${areaM2.toFixed(1)} m²\n${volume.toFixed(1)} m³`
        : `${areaM2.toFixed(1)} m²`;

      const label = new FabricText(labelText, {
        left: center.x,
        top: center.y,
        fontSize: 16,
        fill: '#000000',
        backgroundColor: strokeColor,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      // Add to canvas
      fabricCanvas.add(polygon);
      fabricCanvas.add(label);

      // Store measurement
      const measurement: AreaMeasurement = {
        id: `area-${Date.now()}`,
        polygon,
        label,
        area: areaM2,
        volume,
        color: areaColor,
      };

      setMeasurements(prev => [...prev, measurement]);

      // Clean up preview
      previewCirclesRef.current.forEach(circle => fabricCanvas.remove(circle));
      if (previewLineRef.current) fabricCanvas.remove(previewLineRef.current);
      
      setPoints([]);
      previewCirclesRef.current = [];
      previewLineRef.current = null;
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:up", handleMouseUp);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.off("mouse:move", handleMouseMove);
      
      // Restore background selectability when exiting mode
      if (background) {
        const shouldBeLocked = (background as any).backgroundLocked !== false;
        background.selectable = !shouldBeLocked;
        background.evented = !shouldBeLocked;
      }
      
      // Clean up refs
      dragPointRef.current = null;
      dragCircleRef.current = null;
    };
  }, [fabricCanvas, mode, scale, areaColor, areaOpacity, heightValue]);

  const deleteMeasurement = (id: string) => {
    const measurement = measurements.find(m => m.id === id);
    if (measurement && fabricCanvas) {
      fabricCanvas.remove(measurement.polygon);
      fabricCanvas.remove(measurement.label);
      setMeasurements(prev => prev.filter(m => m.id !== id));
      fabricCanvas.renderAll();
    }
  };

  return {
    measurements,
    deleteMeasurement,
    isDrawing: points.length > 0,
  };
};
