import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Image as FabricImage, FabricObject, Point, Circle, Path, Group } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crop, Ruler, Grid3x3, Download, X, Eraser, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: (canvas: FabricCanvas) => void;
  onExtract?: (dataUrl: string) => void;
  selectedSymbol?: string | null;
  onSymbolPlaced?: (symbolId: string) => void;
  onSymbolDeselect?: () => void;
}

interface Position {
  x: number;
  y: number;
}

export const CanvasWorkspace = ({ imageUrl, pageNumber, onExport, onExtract, selectedSymbol, onSymbolPlaced, onSymbolDeselect }: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure" | "erase" | "place-symbol">("select");
  const [scale, setScale] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<string>("400");
  const [showGrid, setShowGrid] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);
  
  // Crop state
  const [cropStart, setCropStart] = useState<Position | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  
  // Measure state
  const [measureStart, setMeasureStart] = useState<Position | null>(null);
  const [measureLine, setMeasureLine] = useState<Line | null>(null);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);
  
  // Eraser state
  const [eraseStart, setEraseStart] = useState<Position | null>(null);
  const [eraseRect, setEraseRect] = useState<Rect | null>(null);
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  // Right-click panning
  const isPanningRef = useRef(false);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  // Helper function to snap to grid
  const snapToGrid = (value: number, gridSpacing: number): number => {
    if (!scale || !showGrid || gridSpacing <= 0) return value;
    return Math.round(value / gridSpacing) * gridSpacing;
  };

  // Create symbol shape based on type
  const createSymbol = (type: string, x: number, y: number): FabricObject | null => {
    const size = 6; // 5x smaller than original 30
    const halfSize = size / 2;
    
    switch (type) {
      case "light":
        // Circle with cross
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
        
      case "power":
        // Rectangle with parallel lines
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
        
      case "switch":
        // Line with angle
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
        
      case "data":
        // Diamond shape
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
        
      case "smoke":
        // Triangle with exclamation
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
        
      case "cable":
        // Wavy line
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
        
      default:
        return null;
    }
  };
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Enable Fabric right-click events and prevent context menu
    (canvas as any).fireRightClick = true;
    (canvas as any).stopContextMenu = true;

    FabricImage.fromURL(imageUrl).then((img) => {
      const scale = Math.min(800 / img.width!, 600 / img.height!);
      img.scale(scale);
      canvas.backgroundImage = img;
      canvas.renderAll();
      
      // Save initial state after background loads
      saveCanvasState(canvas);
    });

    // Mouse wheel zoom
    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      setZoomLevel(zoom);
      setGridUpdateTrigger((prev) => prev + 1);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    canvas.on("mouse:wheel", handleWheel);

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Prevent context menu
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    
    const contextHandler = (e: MouseEvent) => e.preventDefault();
    
    canvasEl.addEventListener("contextmenu", contextHandler);
    containerEl.addEventListener("contextmenu", contextHandler);
    
    return () => {
      canvasEl.removeEventListener("contextmenu", contextHandler);
      containerEl.removeEventListener("contextmenu", contextHandler);
    };
  }, []);

  // Middle mouse button panning via native pointer events
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const upperCanvas = fabricCanvas.upperCanvasEl as HTMLCanvasElement;
    if (!upperCanvas) return;

    let isMiddlePanning = false;
    let lastPos: { x: number; y: number } | null = null;

    const pointerDownHandler = (e: PointerEvent) => {
      // Check for middle button: button === 1 OR buttons includes bit 4
      if (e.button === 1 || (e.buttons & 4) !== 0) {
        e.preventDefault();
        isMiddlePanning = true;
        lastPos = { x: e.clientX, y: e.clientY };
        upperCanvas.setPointerCapture(e.pointerId);
        fabricCanvas.setCursor("grabbing");
        fabricCanvas.selection = false;
        fabricCanvas.skipTargetFind = true;
      }
    };

    const pointerMoveHandler = (e: PointerEvent) => {
      if (!isMiddlePanning || !lastPos) return;
      
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      
      fabricCanvas.relativePan(new Point(dx, dy));
      fabricCanvas.requestRenderAll();
      setGridUpdateTrigger((prev) => prev + 1);
    };

    const pointerUpHandler = (e: PointerEvent) => {
      if (isMiddlePanning) {
        isMiddlePanning = false;
        lastPos = null;
        try {
          upperCanvas.releasePointerCapture(e.pointerId);
        } catch {}
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true;
        fabricCanvas.skipTargetFind = false;
      }
    };

    const auxClickHandler = (e: MouseEvent) => {
      // Prevent auxclick (fires after middle button release)
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    upperCanvas.addEventListener('pointerdown', pointerDownHandler);
    upperCanvas.addEventListener('pointermove', pointerMoveHandler);
    upperCanvas.addEventListener('pointerup', pointerUpHandler);
    upperCanvas.addEventListener('pointercancel', pointerUpHandler);
    upperCanvas.addEventListener('auxclick', auxClickHandler);

    return () => {
      upperCanvas.removeEventListener('pointerdown', pointerDownHandler);
      upperCanvas.removeEventListener('pointermove', pointerMoveHandler);
      upperCanvas.removeEventListener('pointerup', pointerUpHandler);
      upperCanvas.removeEventListener('pointercancel', pointerUpHandler);
      upperCanvas.removeEventListener('auxclick', auxClickHandler);
    };
  }, [fabricCanvas]);

  // Save canvas state for undo/redo
  const saveCanvasState = (canvas?: FabricCanvas) => {
    const targetCanvas = canvas || fabricCanvas;
    if (!targetCanvas) return;
    
    const json = JSON.stringify(targetCanvas.toJSON());
    setUndoStack(prev => [...prev, json]);
    setRedoStack([]); // Clear redo stack on new action
  };

  // Undo functionality
  const handleUndo = () => {
    if (!fabricCanvas || undoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  // Redo functionality
  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, undoStack, redoStack]);

  // Right-click panning via Fabric
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      
      // Only handle right-click here (middle is handled via pointer events above)
      if (e.button === 2) {
        isPanningRef.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        fabricCanvas.setCursor("grabbing");
        fabricCanvas.selection = false;
        fabricCanvas.skipTargetFind = true;
        e.preventDefault();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isPanningRef.current || !lastPanPos.current) return;
      const e = opt.e as MouseEvent;
      
      // Calculate delta using clientX/Y for reliability
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      
      // Use Fabric's relativePan for zoom-aware panning
      fabricCanvas.relativePan(new Point(dx, dy));
      fabricCanvas.requestRenderAll();
      setGridUpdateTrigger((prev) => prev + 1);
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPos.current = null;
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true;
        fabricCanvas.skipTargetFind = false;
      }
    };

    // Document-level mouseup for reliability
    const handleDocMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPos.current = null;
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true;
        fabricCanvas.skipTargetFind = false;
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    document.addEventListener("mouseup", handleDocMouseUp);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      document.removeEventListener("mouseup", handleDocMouseUp);
    };
  }, [fabricCanvas]);

  // Handle crop mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "crop") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

      const handleMouseDown = (opt: any) => {
        // Only respond to left-clicks for crop
        if (opt.e.button !== 0) return;

        const pointer = fabricCanvas.getPointer(opt.e);
        
        if (!cropStart) {
          // First click
          setCropStart({ x: pointer.x, y: pointer.y });
          
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "rgba(0, 123, 255, 0.1)",
            stroke: "blue",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            excludeFromExport: true,
          });
          
          fabricCanvas.add(rect);
          setCropRect(rect);
        } else {
          // Second click - finalize crop
          setShowCropDialog(true);
        }
      };

    const handleMouseMove = (opt: any) => {
      if (!cropStart || !cropRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - cropStart.x;
      const height = pointer.y - cropStart.y;
      
      cropRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : cropStart.x,
        top: height < 0 ? pointer.y : cropStart.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, cropStart, cropRect]);

  // Handle measure mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "measure") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      // Only respond to left-clicks for measure
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      
      if (!measureStart) {
        // First click
        setMeasureStart({ x: pointer.x, y: pointer.y });
        
        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: "red",
          strokeWidth: 2,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        
        fabricCanvas.add(line);
        setMeasureLine(line);
      } else {
        // Second click - calculate distance
        const distance = Math.sqrt(
          Math.pow(pointer.x - measureStart.x, 2) + 
          Math.pow(pointer.y - measureStart.y, 2)
        );
        setMeasureDistance(distance);
        setShowMeasureDialog(true);
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!measureStart || !measureLine) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      measureLine.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, measureStart, measureLine]);

  // Handle erase mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "erase") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      // Only respond to left-clicks for erase
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      setEraseStart({ x: pointer.x, y: pointer.y });
      
      const rect = new Rect({
        left: Math.round(pointer.x),
        top: Math.round(pointer.y),
        width: 0,
        height: 0,
        fill: "#ffffff",
        opacity: 0.7,
        selectable: false,
        evented: false,
        objectCaching: false, // Prevent rendering artifacts from start
      });
      
      fabricCanvas.add(rect);
      setEraseRect(rect);
    };

    const handleMouseMove = (opt: any) => {
      if (!eraseStart || !eraseRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - eraseStart.x;
      const height = pointer.y - eraseStart.y;
      
      eraseRect.set({
        width: Math.round(Math.abs(width)),
        height: Math.round(Math.abs(height)),
        left: Math.round(width < 0 ? pointer.x : eraseStart.x),
        top: Math.round(height < 0 ? pointer.y : eraseStart.y),
      });
      
      fabricCanvas.renderAll();
    };

    const handleMouseUp = async () => {
      if (!eraseStart || !eraseRect) return;
      
      // Snap to integer pixels to avoid anti-aliased seams
      const width = Math.abs((eraseRect.width ?? 0) * (eraseRect.scaleX ?? 1));
      const height = Math.abs((eraseRect.height ?? 0) * (eraseRect.scaleY ?? 1));
      const left = Math.round(eraseRect.left ?? 0);
      const top = Math.round(eraseRect.top ?? 0);
      
      // Finalize the erase rectangle with precise integer bounds
      eraseRect.set({
        left,
        top,
        width: Math.round(width),
        height: Math.round(height),
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      });
      
      // Flatten the erase rect into the background image
      await flattenEraseRect(eraseRect);
      
      setEraseStart(null);
      setEraseRect(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && eraseRect) {
        fabricCanvas.remove(eraseRect);
        setEraseStart(null);
        setEraseRect(null);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, eraseStart, eraseRect]);

  // Reset mode to select
  useEffect(() => {
    if (!fabricCanvas || mode === "crop" || mode === "measure" || mode === "erase" || mode === "place-symbol") return;
    
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = "default";
  }, [fabricCanvas, mode]);

  // Switch to place-symbol mode when symbol selected
  useEffect(() => {
    if (selectedSymbol) {
      setMode("place-symbol");
      toast.info(`Click to place ${selectedSymbol}. Press ESC to cancel.`);
    } else if (mode === "place-symbol") {
      setMode("select");
    }
  }, [selectedSymbol]);

  // Handle symbol placement
  useEffect(() => {
    if (!fabricCanvas || mode !== "place-symbol" || !selectedSymbol) return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "none";
    
    let previewSymbol: FabricObject | null = null;

    const handleMouseMove = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);
      const gridSpacingPx = scale && showGrid ? parseFloat(gridSize) * scale : 0;
      
      let x = pointer.x;
      let y = pointer.y;
      
      // Snap to grid intersection unless Control is held down
      if (gridSpacingPx > 0 && !opt.e.ctrlKey && !opt.e.metaKey) {
        x = snapToGrid(pointer.x, gridSpacingPx);
        y = snapToGrid(pointer.y, gridSpacingPx);
      }
      
      // Remove old preview
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      
      // Create new preview symbol
      previewSymbol = createSymbol(selectedSymbol, x, y);
      if (previewSymbol) {
        previewSymbol.opacity = 0.5;
        previewSymbol.selectable = false;
        previewSymbol.evented = false;
        (previewSymbol as any).isPreview = true;
        fabricCanvas.add(previewSymbol);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseDown = (opt: any) => {
      // Only respond to left-clicks
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      const gridSpacingPx = scale && showGrid ? parseFloat(gridSize) * scale : 0;
      
      let x = pointer.x;
      let y = pointer.y;
      
      // Snap to grid intersection unless Control is held down
      if (gridSpacingPx > 0 && !opt.e.ctrlKey && !opt.e.metaKey) {
        x = snapToGrid(pointer.x, gridSpacingPx);
        y = snapToGrid(pointer.y, gridSpacingPx);
      }
      
      // Remove preview
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
        previewSymbol = null;
      }
      
      const symbol = createSymbol(selectedSymbol, x, y);
      if (symbol) {
        fabricCanvas.add(symbol);
        fabricCanvas.setActiveObject(symbol);
        fabricCanvas.renderAll();
        saveCanvasState();
        onSymbolPlaced?.(selectedSymbol);
        const snapStatus = (gridSpacingPx > 0 && !opt.e.ctrlKey && !opt.e.metaKey) ? " (snapped)" : "";
        toast.success(`${selectedSymbol} placed${snapStatus}`);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewSymbol) {
          fabricCanvas.remove(previewSymbol);
          previewSymbol = null;
        }
        onSymbolDeselect?.();
        setMode("select");
        toast.info("Symbol placement cancelled");
      }
    };

    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:down", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (previewSymbol) {
        fabricCanvas.remove(previewSymbol);
      }
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:down", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, selectedSymbol, scale, showGrid, gridSize]);

  // Handle delete key for symbols
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && fabricCanvas.getActiveObject()) {
        const activeObj = fabricCanvas.getActiveObject();
        if ((activeObj as any).symbolType) {
          fabricCanvas.remove(activeObj);
          fabricCanvas.renderAll();
          saveCanvasState();
          toast.success("Symbol deleted");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fabricCanvas]);


  const handleCrop = () => {
    if (mode === "crop") {
      cancelCrop();
    } else {
      setMode("crop");
      toast.info("Click first corner, then second corner to select crop area");
    }
  };

  const cancelCrop = () => {
    if (cropRect && fabricCanvas) {
      fabricCanvas.remove(cropRect);
    }
    setCropStart(null);
    setCropRect(null);
    setMode("select");
  };

  const handleCropExtract = () => {
    if (!fabricCanvas || !cropRect) return;
    
    // Compute crop bounds
    const left = cropRect.left ?? 0;
    const top = cropRect.top ?? 0;
    const width = (cropRect.width ?? 0) * (cropRect.scaleX ?? 1);
    const height = (cropRect.height ?? 0) * (cropRect.scaleY ?? 1);
    if (width <= 0 || height <= 0) {
      toast.error("Invalid crop area");
      return;
    }

    // Remove crop rect before export to avoid dotted lines
    fabricCanvas.remove(cropRect);

    // Export cropped region as image
    const dataUrl = fabricCanvas.toDataURL({
      left,
      top,
      width,
      height,
      format: "png",
      multiplier: 4, // Higher quality for readability
    });

    // Send to parent to open as new sheet
    onExtract?.(dataUrl);
    toast.success("Extracted to new sheet");
    
    // Clean up
    setCropStart(null);
    setCropRect(null);
    setShowCropDialog(false);
    setMode("select");
  };

  const handleMeasure = () => {
    if (mode === "measure") {
      cancelMeasure();
    } else {
      setMode("measure");
      toast.info("Click first point, then second point to measure distance");
    }
  };

  const cancelMeasure = () => {
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    setMeasureStart(null);
    setMeasureLine(null);
    setMeasureDistance(null);
    setMode("select");
  };

  const handleMeasureSubmit = (realWorldMm: number) => {
    if (!measureDistance) return;
    
    const pixelsPerMm = measureDistance / realWorldMm;
    const ratio = (1 / pixelsPerMm).toFixed(1);
    setScale(pixelsPerMm);
    toast.success(`Scale set: 1:${ratio}`);
    
    // Remove the red measurement line
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    
    setShowMeasureDialog(false);
    setMeasureStart(null);
    setMeasureLine(null);
    setMeasureDistance(null);
    setMode("select");
  };

  const toggleGrid = () => {
    if (!scale) {
      toast.warning("Please set scale using Measure tool first");
      return;
    }
    setShowGrid(!showGrid);
  };

  const handleErase = () => {
    setMode(mode === "erase" ? "select" : "erase");
    if (mode !== "erase") {
      toast.info("Click and drag to white-out areas");
    }
  };

  // Flatten erase rectangle into the background image to eliminate seams
  const flattenEraseRect = async (rect: Rect) => {
    if (!fabricCanvas) return;
    
    const bg = fabricCanvas.backgroundImage as FabricImage;
    if (!bg) return;
    
    // Create offscreen canvas sized to original image
    const offCanvas = document.createElement('canvas');
    const bgWidth = bg.width ?? 0;
    const bgHeight = bg.height ?? 0;
    offCanvas.width = bgWidth;
    offCanvas.height = bgHeight;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current background
    const bgElement = bg.getElement();
    ctx.drawImage(bgElement, 0, 0);
    
    // Map erase rect from canvas coords to image pixel coords
    const bgLeft = bg.left ?? 0;
    const bgTop = bg.top ?? 0;
    const bgScaleX = bg.scaleX ?? 1;
    const bgScaleY = bg.scaleY ?? 1;
    
    const x = Math.max(0, Math.round((rect.left! - bgLeft) / bgScaleX));
    const y = Math.max(0, Math.round((rect.top! - bgTop) / bgScaleY));
    const w = Math.max(0, Math.round((rect.width! * (rect.scaleX ?? 1)) / bgScaleX));
    const h = Math.max(0, Math.round((rect.height! * (rect.scaleY ?? 1)) / bgScaleY));
    
    // Draw white rectangle on image
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    
    // Create new background from modified image
    const newDataUrl = offCanvas.toDataURL('image/png');
    const newImg = await FabricImage.fromURL(newDataUrl);
    newImg.set({
      scaleX: bgScaleX,
      scaleY: bgScaleY,
      left: bgLeft,
      top: bgTop,
    });
    
    // Replace background and remove the rect object
    fabricCanvas.backgroundImage = newImg;
    fabricCanvas.remove(rect);
    fabricCanvas.renderAll();
    saveCanvasState(fabricCanvas);
  };

  // Calculate grid spacing for CSS overlay - adjusted for viewport transform
  // Recalculates on every render (triggered by gridUpdateTrigger changes during pan/zoom)
  const gridSpacing = (() => {
    if (!scale || !showGrid || !fabricCanvas) return 0;
    const baseSpacing = parseFloat(gridSize) * scale;
    const vpt = fabricCanvas.viewportTransform;
    if (!vpt) return 0;
    // Apply zoom from viewport transform
    return baseSpacing * vpt[0];
  })();

  // Calculate grid offset based on viewport pan
  const gridOffset = (() => {
    if (!fabricCanvas) return { x: 0, y: 0 };
    const vpt = fabricCanvas.viewportTransform;
    if (!vpt) return { x: 0, y: 0 };
    return { x: vpt[4], y: vpt[5] };
  })();

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col">
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={mode === "crop" ? "default" : "outline"}
              size="sm"
              onClick={handleCrop}
            >
              {mode === "crop" ? <X className="w-4 h-4 mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
              {mode === "crop" ? "Cancel" : "Crop"}
            </Button>
            <Button
              variant={mode === "measure" ? "default" : "outline"}
              size="sm"
              onClick={handleMeasure}
            >
              {mode === "measure" ? <X className="w-4 h-4 mr-2" /> : <Ruler className="w-4 h-4 mr-2" />}
              {mode === "measure" ? "Cancel" : "Measure"}
            </Button>
            <Button
              variant={mode === "erase" ? "default" : "outline"}
              size="sm"
              onClick={handleErase}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Erase
            </Button>
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={toggleGrid}
              disabled={!scale}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
            {showGrid && (
              <div className="flex items-center gap-2 ml-4">
                <Label htmlFor="gridSize" className="text-sm whitespace-nowrap">
                  Grid (mm):
                </Label>
                <Input
                  id="gridSize"
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(e.target.value)}
                  className="w-20"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fabricCanvas && onExport(fabricCanvas)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <div className="flex items-center gap-4 ml-auto">
              {scale && (
                <span className="text-sm text-muted-foreground">
                  Scale: 1:{(1 / scale).toFixed(1)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </Card>

        <div 
          ref={containerRef}
          className="flex-1 border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center relative"
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas ref={canvasRef} onContextMenu={(e) => e.preventDefault()} />
          {/* Fixed grid overlay */}
          {showGrid && gridSpacing > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(to right, rgba(80,80,80,0.5) 0, rgba(80,80,80,0.5) 1px, transparent 1px, transparent ${gridSpacing}px),
                  repeating-linear-gradient(to bottom, rgba(80,80,80,0.5) 0, rgba(80,80,80,0.5) 1px, transparent 1px, transparent ${gridSpacing}px)
                `,
                backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
                backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
              }}
            />
          )}
        </div>
      </div>

      {/* Crop Dialog */}
      <AlertDialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extract to New Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to extract the selected area to a new sheet?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelCrop}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleCropExtract}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Measure Dialog */}
      <AlertDialog open={showMeasureDialog} onOpenChange={setShowMeasureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the real-world distance in millimeters for the measured line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            <Label htmlFor="realDistance">Distance (mm):</Label>
            <Input
              id="realDistance"
              type="number"
              placeholder="e.g., 1000"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (value > 0) handleMeasureSubmit(value);
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelMeasure}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const input = document.getElementById("realDistance") as HTMLInputElement;
                const value = parseFloat(input.value);
                if (value > 0) handleMeasureSubmit(value);
              }}
            >
              Set Scale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
