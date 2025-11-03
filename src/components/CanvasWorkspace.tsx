import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Canvas as FabricCanvas, Image as FabricImage, Point, FabricObject } from "fabric";
import { toast } from "sonner";
import { CanvasToolbar } from "./CanvasToolbar";
import { GridOverlay } from "./GridOverlay";
import { CanvasDialogs } from "./CanvasDialogs";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useSymbolCreation } from "@/hooks/useSymbolCreation";
import { useCropMode } from "@/hooks/useCropMode";
import { useMeasureMode } from "@/hooks/useMeasureMode";
import { useEraseMode } from "@/hooks/useEraseMode";
import { useSymbolPlacement } from "@/hooks/useSymbolPlacement";

interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: (canvas: FabricCanvas) => void;
  onExtract?: (dataUrl: string) => void;
  selectedSymbol?: string | null;
  onSymbolPlaced?: (symbolId: string) => void;
  onSymbolDeselect?: () => void;
}

export const CanvasWorkspace = ({ 
  imageUrl, 
  pageNumber, 
  onExport, 
  onExtract, 
  selectedSymbol, 
  onSymbolPlaced, 
  onSymbolDeselect 
}: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure" | "erase" | "place-symbol">("select");
  const [scale, setScale] = useState<number | null>(null);
  const [bgScale, setBgScale] = useState<number>(1);
  const [gridSize, setGridSize] = useState<string>("400");
  const [showGrid, setShowGrid] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);
  
  // Grid appearance
  const [gridColor, setGridColor] = useState<string>("#505050");
  const [gridThickness, setGridThickness] = useState<number>(1);
  const [gridOpacity, setGridOpacity] = useState<number>(0.5);
  
  // Dialog states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);
  
  // Panning refs
  const isPanningRef = useRef(false);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  // Hooks
  const { undoStack, redoStack, saveCanvasState, handleUndo, handleRedo } = useUndoRedo(fabricCanvas);
  const { createSymbol } = useSymbolCreation();
  const { cropRect, cancelCrop } = useCropMode(fabricCanvas, mode, () => setShowCropDialog(true));
  const { measureDistance, measureLine, cancelMeasure } = useMeasureMode(fabricCanvas, mode, () => setShowMeasureDialog(true));
  useEraseMode(fabricCanvas, mode, saveCanvasState);
  useSymbolPlacement(
    fabricCanvas,
    mode,
    selectedSymbol ?? null,
    showGrid,
    scale,
    bgScale,
    gridSize,
    createSymbol,
    onSymbolPlaced,
    onSymbolDeselect,
    saveCanvasState,
    setMode
  );

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Match container DOM size
    const setCanvasToContainerSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const w = Math.max(1, Math.floor(container.clientWidth));
      const h = Math.max(1, Math.floor(container.clientHeight));
      canvas.setWidth(w);
      canvas.setHeight(h);
      canvas.calcOffset && canvas.calcOffset();
    };
    
    setCanvasToContainerSize();
    
    const onResize = () => {
      setCanvasToContainerSize();
      setGridUpdateTrigger((s) => s + 1);
    };
    window.addEventListener("resize", onResize);

    // Enable right-click events
    (canvas as any).fireRightClick = true;
    (canvas as any).stopContextMenu = true;

    // Load background image
    FabricImage.fromURL(imageUrl).then((img) => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const scaleBg = Math.min(canvasWidth / (img.width ?? 1), canvasHeight / (img.height ?? 1));

      img.set({
        scaleX: scaleBg,
        scaleY: scaleBg,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = img;
      canvas.requestRenderAll();

      console.log("Canvas background loaded", {
        canvasWidth,
        canvasHeight,
        imgWidth: img.width,
        imgHeight: img.height,
        scaleBg,
      });

      setBgScale(scaleBg);
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

      const vpt = canvas.viewportTransform;
      console.log("wheel zoom", { zoom, offsetX: opt.e.offsetX, offsetY: opt.e.offsetY, vpt });

      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    canvas.on("mouse:wheel", handleWheel);
    setFabricCanvas(canvas);

    return () => {
      window.removeEventListener("resize", onResize);
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

  // Middle mouse button panning
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const upperCanvas = fabricCanvas.upperCanvasEl as HTMLCanvasElement;
    if (!upperCanvas) return;

    let isMiddlePanning = false;
    let lastPos: { x: number; y: number } | null = null;

    const pointerDownHandler = (e: PointerEvent) => {
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
      if (e.button === 1) e.preventDefault();
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

  // Right-click panning
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      
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
      
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      
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

  // Touch pinch zoom support
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const upperCanvas = fabricCanvas.upperCanvasEl as HTMLCanvasElement;
    if (!upperCanvas) return;

    let lastDistance = 0;
    let lastCenter: { x: number; y: number } | null = null;

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      if (touches.length < 2) return null;
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastDistance = getTouchDistance(e.touches);
        lastCenter = getTouchCenter(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistance && lastCenter) {
        e.preventDefault();
        
        const newDistance = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);
        
        if (!newCenter) return;

        // Calculate zoom
        const scale = newDistance / lastDistance;
        let zoom = fabricCanvas.getZoom();
        zoom = zoom * scale;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;

        // Get canvas offset
        const rect = upperCanvas.getBoundingClientRect();
        const offsetX = newCenter.x - rect.left;
        const offsetY = newCenter.y - rect.top;

        fabricCanvas.zoomToPoint(new Point(offsetX, offsetY), zoom);
        setZoomLevel(zoom);
        setGridUpdateTrigger((prev) => prev + 1);

        lastDistance = newDistance;
        lastCenter = newCenter;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastDistance = 0;
        lastCenter = null;
      }
    };

    upperCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    upperCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    upperCanvas.addEventListener('touchend', handleTouchEnd);
    upperCanvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      upperCanvas.removeEventListener('touchstart', handleTouchStart);
      upperCanvas.removeEventListener('touchmove', handleTouchMove);
      upperCanvas.removeEventListener('touchend', handleTouchEnd);
      upperCanvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [fabricCanvas]);

  // Touch panning (single finger)
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const upperCanvas = fabricCanvas.upperCanvasEl as HTMLCanvasElement;
    if (!upperCanvas) return;

    let isTouchPanning = false;
    let lastTouchPos: { x: number; y: number } | null = null;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && mode === "select") {
        touchStartTime = Date.now();
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        // Start panning after a short delay to distinguish from tap
        setTimeout(() => {
          if (lastTouchPos && Date.now() - touchStartTime >= 100) {
            isTouchPanning = true;
            fabricCanvas.setCursor("grabbing");
            fabricCanvas.selection = false;
          }
        }, 100);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouchPanning && lastTouchPos) {
        e.preventDefault();
        
        const dx = e.touches[0].clientX - lastTouchPos.x;
        const dy = e.touches[0].clientY - lastTouchPos.y;
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        fabricCanvas.relativePan(new Point(dx, dy));
        fabricCanvas.requestRenderAll();
        setGridUpdateTrigger((prev) => prev + 1);
      }
    };

    const handleTouchEnd = () => {
      if (isTouchPanning) {
        isTouchPanning = false;
        lastTouchPos = null;
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true;
      }
    };

    upperCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    upperCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    upperCanvas.addEventListener('touchend', handleTouchEnd);
    upperCanvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      upperCanvas.removeEventListener('touchstart', handleTouchStart);
      upperCanvas.removeEventListener('touchmove', handleTouchMove);
      upperCanvas.removeEventListener('touchend', handleTouchEnd);
      upperCanvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [fabricCanvas, mode]);

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

  // Snap symbols to grid while dragging
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMoving = (e: any) => {
      if (!scale || !showGrid || !bgScale || !fabricCanvas) return;
      const obj = e.target as FabricObject | undefined;
      if (!obj || !(obj as any).symbolType) return;
      
      const baseSpacing = parseFloat(gridSize) * (scale ?? 1);
      if (!baseSpacing) return;

      const left = obj.left ?? 0;
      const top = obj.top ?? 0;

      console.log("[DRAG] Object moving:", {
        gridSize: parseFloat(gridSize),
        scale,
        bgScale,
        baseSpacing,
        objLeft: left,
        objTop: top,
      });

      const snappedLeft = Math.round(left / baseSpacing) * baseSpacing;
      const snappedTop = Math.round(top / baseSpacing) * baseSpacing;

      console.log("[DRAG] Snapped:", {
        before: { left, top },
        after: { left: snappedLeft, top: snappedTop },
        delta: { left: snappedLeft - left, top: snappedTop - top },
      });

      obj.set({
        left: snappedLeft,
        top: snappedTop,
      });
    };

    fabricCanvas.on("object:moving", handleMoving);
    return () => {
      fabricCanvas.off("object:moving", handleMoving);
    };
  }, [fabricCanvas, scale, showGrid, gridSize, bgScale]);

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

  // Handlers
  const handleCrop = () => {
    if (mode === "crop") {
      cancelCrop();
      setMode("select");
    } else {
      setMode("crop");
      toast.info("Click first corner, then second corner to select crop area");
    }
  };

  const handleCropExtract = () => {
    if (!fabricCanvas || !cropRect) return;
    
    const left = cropRect.left ?? 0;
    const top = cropRect.top ?? 0;
    const width = (cropRect.width ?? 0) * (cropRect.scaleX ?? 1);
    const height = (cropRect.height ?? 0) * (cropRect.scaleY ?? 1);
    if (width <= 0 || height <= 0) {
      toast.error("Invalid crop area");
      return;
    }

    fabricCanvas.remove(cropRect);

    const dataUrl = fabricCanvas.toDataURL({
      left,
      top,
      width,
      height,
      format: "png",
      multiplier: 4,
    });

    onExtract?.(dataUrl);
    toast.success("Extracted to new sheet");
    
    cancelCrop();
    setShowCropDialog(false);
    setMode("select");
  };

  const handleMeasure = () => {
    if (mode === "measure") {
      cancelMeasure();
      setMode("select");
    } else {
      setMode("measure");
      toast.info("Click first point, then second point to measure distance");
    }
  };

  const handleMeasureSubmit = (realWorldMm: number) => {
    if (!measureDistance) return;
    
    const pixelsPerMm = measureDistance / realWorldMm;
    const ratio = (1 / pixelsPerMm).toFixed(1);
    setScale(pixelsPerMm);
    toast.success(`Scale set: 1:${ratio}`);
    
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    
    setShowMeasureDialog(false);
    cancelMeasure();
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

  // Grid calculations
  const gridSpacing = (() => {
    if (!scale || !showGrid || !fabricCanvas) return 0;
    const baseSpacing = parseFloat(gridSize) * scale;
    const vpt = fabricCanvas.viewportTransform;
    if (!vpt) return 0;
    // Scale with zoom only (screen-fixed)
    return baseSpacing * vpt[0];
  })();

  const gridOffset = { x: 0, y: 0 };

  const hexToRgba = (hex: string, alpha: number) => {
    try {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const num = parseInt(h, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const a = Math.max(0, Math.min(1, alpha));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    } catch {
      return `rgba(80,80,80,${Math.max(0, Math.min(1, alpha))})`;
    }
  };
  const gridLineColor = hexToRgba(gridColor, gridOpacity);
  const gridLineThickness = `${Math.max(1, Math.round(gridThickness))}px`;

  useEffect(() => {
    if (!fabricCanvas) return;
    console.log("[GRID] overlay values", { gridSpacing, gridOffset, bgScale, scale, gridSize: parseFloat(gridSize) });
  }, [gridUpdateTrigger, gridSpacing, gridOffset, bgScale, scale, fabricCanvas, gridSize]);

  return (
    <div className="flex gap-2 sm:gap-4 h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <CanvasToolbar
          mode={mode}
          scale={scale}
          showGrid={showGrid}
          gridSize={gridSize}
          gridColor={gridColor}
          gridThickness={gridThickness}
          gridOpacity={gridOpacity}
          zoomLevel={zoomLevel}
          undoStackLength={undoStack.length}
          redoStackLength={redoStack.length}
          onCrop={handleCrop}
          onMeasure={handleMeasure}
          onErase={handleErase}
          onToggleGrid={toggleGrid}
          onGridSizeChange={setGridSize}
          onGridColorChange={setGridColor}
          onGridThicknessChange={setGridThickness}
          onGridOpacityChange={setGridOpacity}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={() => fabricCanvas && onExport(fabricCanvas)}
        />

          <div 
            ref={containerRef}
            className="flex-1 border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center relative touch-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas ref={canvasRef} className="touch-none select-none block" onContextMenu={(e) => e.preventDefault()} />
            <GridOverlay
              showGrid={showGrid}
              gridSpacing={gridSpacing}
              gridOffset={gridOffset}
              gridLineColor={gridLineColor}
              gridLineThickness={gridLineThickness}
            />
        </div>
      </div>

      <CanvasDialogs
        showCropDialog={showCropDialog}
        showMeasureDialog={showMeasureDialog}
        onCropDialogChange={setShowCropDialog}
        onMeasureDialogChange={setShowMeasureDialog}
        onCropExtract={handleCropExtract}
        onCancelCrop={() => {
          cancelCrop();
          setMode("select");
        }}
        onMeasureSubmit={handleMeasureSubmit}
        onCancelMeasure={() => {
          cancelMeasure();
          setMode("select");
        }}
      />
    </div>
  );
};
