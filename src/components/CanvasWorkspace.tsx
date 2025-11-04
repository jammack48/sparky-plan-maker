import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Point } from "fabric";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasDialogs } from "./CanvasDialogs";
import { GridOverlay } from "./GridOverlay";
import { useCropMode } from "@/hooks/useCropMode";
import { useMeasureMode } from "@/hooks/useMeasureMode";
import { useEraseMode } from "@/hooks/useEraseMode";
import { useSymbolPlacement } from "@/hooks/useSymbolPlacement";
import { useSymbolCreation } from "@/hooks/useSymbolCreation";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { toast } from "sonner";

export interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: () => void;
  onExtract: (dataUrl: string) => void;
  selectedSymbol: string | null;
  onSymbolPlaced?: (symbolId: string) => void;
  onSymbolDeselect?: () => void;
  symbolColor?: string;
  symbolThickness?: number;
  symbolTransparency?: number;
  symbolScale?: number;
}

export const CanvasWorkspace = ({
  imageUrl,
  onExtract,
  selectedSymbol,
  onSymbolPlaced,
  onSymbolDeselect,
  symbolColor = "#000000",
  symbolThickness = 2,
  symbolTransparency = 1,
  symbolScale = 1,
}: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure" | "erase" | "place-symbol">("select");
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState("1000");
  const [gridColor, setGridColor] = useState("#ff0000");
  const [gridThickness, setGridThickness] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [scale, setScale] = useState<number | null>(null);
  const [bgScale, setBgScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const { createSymbol } = useSymbolCreation(symbolColor, symbolThickness, symbolTransparency, symbolScale);
  const { undoStack, redoStack, saveCanvasState, handleUndo, handleRedo } = useUndoRedo(fabricCanvas);

  useEffect(() => {
    if (selectedSymbol) {
      setMode("place-symbol");
    } else if (mode === "place-symbol") {
      setMode("select");
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#f5f5f5",
      selection: true,
    });

    setFabricCanvas(canvas);

    const handleResize = () => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.renderAll();
      setGridUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#f5f5f5";
    } catch (e) {
      console.error("Canvas clear error:", e);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fabricImage = new FabricImage(img, {
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        objectCaching: true,
      });

      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();
      const imgAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;

      let scaleFactor;
      if (imgAspect > canvasAspect) {
        scaleFactor = (canvasWidth * 0.9) / img.width;
      } else {
        scaleFactor = (canvasHeight * 0.9) / img.height;
      }

      fabricImage.scale(scaleFactor);
      setBgScale(scaleFactor);

      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;
      fabricImage.set({
        left: (canvasWidth - scaledWidth) / 2,
        top: (canvasHeight - scaledHeight) / 2,
      });

      fabricCanvas.add(fabricImage);
      fabricCanvas.sendObjectToBack(fabricImage);
      fabricCanvas.renderAll();
      saveCanvasState();
    };
    img.src = imageUrl;
  }, [fabricCanvas, imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Prevent right-click context menu
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    fabricCanvas.upperCanvasEl.addEventListener("contextmenu", preventContextMenu);

    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      const prevZoom = fabricCanvas.getZoom();
      let newZoom = prevZoom * (0.999 ** delta);
      newZoom = Math.min(Math.max(0.1, newZoom), 20);
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      fabricCanvas.renderAll();
      setZoom(newZoom);
      setGridUpdateTrigger(prev => prev + 1);
      console.log("[ZOOM]", { delta, prevZoom, newZoom, offsetX: opt.e.offsetX, offsetY: opt.e.offsetY });
    };

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      console.log("[MOUSEDOWN]", { button: e.button, buttons: (e as any).buttons, which: (e as any).which, ctrl: e.ctrlKey, space: isSpacePressed });
      // Pan with right mouse OR space+left
      if (e.button === 2 || (isSpacePressed && e.button === 0)) {
        e.preventDefault();
        (fabricCanvas as any).isDragging = true;
        setIsPanning(true);
        fabricCanvas.selection = false;
        (fabricCanvas as any).lastPosX = e.clientX;
        (fabricCanvas as any).lastPosY = e.clientY;
        fabricCanvas.defaultCursor = "grabbing";
        console.log("[PAN:start]", { clientX: e.clientX, clientY: e.clientY, via: e.button === 2 ? 'right' : 'space+left' });
      }
    };

    const handleMouseMove = (opt: any) => {
      if ((fabricCanvas as any).isDragging) {
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          const dx = opt.e.clientX - (fabricCanvas as any).lastPosX;
          const dy = opt.e.clientY - (fabricCanvas as any).lastPosY;
          vpt[4] += dx;
          vpt[5] += dy;
          fabricCanvas.requestRenderAll();
          (fabricCanvas as any).lastPosX = opt.e.clientX;
          (fabricCanvas as any).lastPosY = opt.e.clientY;
          console.log("[PAN:move]", { dx, dy, vptTx: vpt[4], vptTy: vpt[5] });
        }
      }
    };

    const handleMouseUp = () => {
      fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
      (fabricCanvas as any).isDragging = false;
      setIsPanning(false);
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = mode === "place-symbol" ? "none" : "default";
      // Only log pan end if we were dragging
      if ((fabricCanvas as any).wasDraggingLogged !== false) {
        console.log("[PAN:end]");
      }
    };

    fabricCanvas.on("mouse:wheel", handleWheel);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.upperCanvasEl?.removeEventListener("contextmenu", preventContextMenu);
      fabricCanvas.off("mouse:wheel", handleWheel);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas, mode, scale, showGrid, gridSize]);

  // Debug listeners: DOM and Fabric mouse events to identify which mouse input is sent
  useEffect(() => {
    if (!fabricCanvas) return;
    const el = fabricCanvas.upperCanvasEl as HTMLCanvasElement | null;

    const logDom = (label: string) => (ev: any) => {
      console.log(`[DOM ${label}]`, {
        type: ev?.type,
        button: ev?.button,
        buttons: ev?.buttons,
        which: ev?.which,
        ctrl: !!ev?.ctrlKey,
        alt: !!ev?.altKey,
        meta: !!ev?.metaKey,
        shift: !!ev?.shiftKey,
        clientX: ev?.clientX,
        clientY: ev?.clientY,
      });
    };

    const domDown = logDom('mousedown');
    const domUp = logDom('mouseup');
    const domMove = logDom('mousemove');
    const domContext = logDom('contextmenu');
    const ptrDown = logDom('pointerdown');
    const ptrUp = logDom('pointerup');
    const ptrMove = logDom('pointermove');

    el?.addEventListener('mousedown', domDown);
    el?.addEventListener('mouseup', domUp);
    el?.addEventListener('mousemove', domMove);
    el?.addEventListener('contextmenu', domContext);
    el?.addEventListener('pointerdown', ptrDown);
    el?.addEventListener('pointerup', ptrUp);
    el?.addEventListener('pointermove', ptrMove);

    const logFabric = (label: string) => (opt: any) => {
      const e = opt?.e;
      console.log(`[FABRIC ${label}]`, e ? {
        type: e.type,
        button: e.button,
        buttons: e.buttons,
        which: e.which,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
        shift: e.shiftKey,
        clientX: e.clientX,
        clientY: e.clientY,
      } : { opt });
    };

    const fDown = logFabric('mouse:down');
    const fUp = logFabric('mouse:up');
    const fMove = logFabric('mouse:move');

    fabricCanvas.on('mouse:down', fDown);
    fabricCanvas.on('mouse:up', fUp);
    fabricCanvas.on('mouse:move', fMove);

    return () => {
      el?.removeEventListener('mousedown', domDown);
      el?.removeEventListener('mouseup', domUp);
      el?.removeEventListener('mousemove', domMove);
      el?.removeEventListener('contextmenu', domContext);
      el?.removeEventListener('pointerdown', ptrDown);
      el?.removeEventListener('pointerup', ptrUp);
      el?.removeEventListener('pointermove', ptrMove);
      fabricCanvas.off('mouse:down', fDown);
      fabricCanvas.off('mouse:up', fUp);
      fabricCanvas.off('mouse:move', fMove);
    };
  }, [fabricCanvas]);

  // Grid is screen-anchored; no offset recomputation on pan/zoom
  // (gridOffset is always {0,0} when rendering)

  // Spacebar pan key handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        setIsSpacePressed(true);
        // prevent page scroll
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        setIsSpacePressed(false);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown as any, { passive: false } as any);
    window.addEventListener('keyup', onKeyUp as any, { passive: false } as any);
    return () => {
      window.removeEventListener('keydown', onKeyDown as any);
      window.removeEventListener('keyup', onKeyUp as any);
    };
  }, []);

  // Update cursor when holding space (not dragging)
  useEffect(() => {
    if (!fabricCanvas) return;
    if ((fabricCanvas as any).isDragging) return;
    fabricCanvas.defaultCursor = isSpacePressed ? 'grab' : (mode === 'place-symbol' ? 'none' : 'default');
  }, [fabricCanvas, isSpacePressed, mode]);
  useEffect(() => {
    if (!fabricCanvas || !scale || !showGrid) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj || (obj as any).isPreview) return;

      if (e.e.ctrlKey || e.e.metaKey) {
        const vpt = fabricCanvas.viewportTransform;
        if (!vpt) return;

        // Calculate half-grid spacing in screen pixels
        const baseSpacing = parseFloat(gridSize) * scale * zoom;
        const stepPx = baseSpacing / 2;

        if (stepPx <= 0) return;

        // Get object center in world coordinates
        const center = obj.getCenterPoint();
        
        // Convert to screen coordinates
        const xScreen = center.x * vpt[0] + vpt[4];
        const yScreen = center.y * vpt[3] + vpt[5];

        // Snap to screen grid
        const xSnap = Math.round(xScreen / stepPx) * stepPx;
        const ySnap = Math.round(yScreen / stepPx) * stepPx;

        // Convert back to world coordinates
        const xWorld = (xSnap - vpt[4]) / vpt[0];
        const yWorld = (ySnap - vpt[5]) / vpt[3];

        // Set position (objects have center origin)
        obj.set({
          left: xWorld - (obj.width! * obj.scaleX!) / 2,
          top: yWorld - (obj.height! * obj.scaleY!) / 2,
        });
        obj.setCoords();
      }
    };

    fabricCanvas.on("object:moving", handleObjectMoving);

    return () => {
      fabricCanvas.off("object:moving", handleObjectMoving);
    };
  }, [fabricCanvas, scale, showGrid, gridSize, zoom]);

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);

  const { cropRect, cancelCrop } = useCropMode(fabricCanvas, mode, () => setShowCropDialog(true));
  const { measureDistance, measureLine, cancelMeasure } = useMeasureMode(fabricCanvas, mode, () => setShowMeasureDialog(true));
  useEraseMode(fabricCanvas, mode, saveCanvasState);

  const handleCropExtract = useCallback(() => {
    if (!fabricCanvas || !cropRect) return;
    const dataUrl = fabricCanvas.toDataURL({
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.width! * cropRect.scaleX!,
      height: cropRect.height! * cropRect.scaleY!,
      multiplier: 1,
    });
    onExtract(dataUrl);
    fabricCanvas.remove(cropRect);
    cancelCrop();
    setShowCropDialog(false);
    setMode("select");
  }, [fabricCanvas, cropRect, onExtract, cancelCrop]);

  const handleMeasureSubmit = useCallback((realDistance: number) => {
    if (measureDistance && measureDistance > 0) {
      const calculatedScale = measureDistance / realDistance; // px per mm
      setScale(calculatedScale);
      toast.success(`Scale set: ${realDistance}mm = ${measureDistance.toFixed(0)}px`);
    }
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    cancelMeasure();
    setShowMeasureDialog(false);
    setMode("select");
  }, [measureDistance, measureLine, fabricCanvas, cancelMeasure]);
  useSymbolPlacement(
    fabricCanvas,
    mode,
    selectedSymbol,
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

  const gridSpacing = scale && showGrid ? parseFloat(gridSize) * scale * zoom : 0;

  const handleModeChange = (newMode: "crop" | "measure" | "erase") => {
    if (mode === newMode) {
      setMode("select");
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CanvasToolbar
        mode={mode}
        scale={scale}
        showGrid={showGrid}
        gridSize={gridSize}
        gridColor={gridColor}
        gridThickness={gridThickness}
        gridOpacity={gridOpacity}
        zoomLevel={zoom}
        undoStackLength={undoStack.length}
        redoStackLength={redoStack.length}
        onCrop={() => handleModeChange("crop")}
        onMeasure={() => handleModeChange("measure")}
        onErase={() => handleModeChange("erase")}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onGridSizeChange={setGridSize}
        onGridColorChange={setGridColor}
        onGridThicknessChange={setGridThickness}
        onGridOpacityChange={setGridOpacity}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={() => toast.info("Export coming soon")}
      />

      <div ref={containerRef} className="relative flex-1 bg-muted">
        <canvas ref={canvasRef} />
        <GridOverlay
          showGrid={showGrid}
          gridSpacing={gridSpacing}
          gridOffset={{ x: 0, y: 0 }}
          gridLineColor={gridColor}
          gridLineThickness={`${gridThickness}px`}
          gridOpacity={gridOpacity}
        />
      </div>

      <CanvasDialogs
        showCropDialog={showCropDialog}
        showMeasureDialog={showMeasureDialog}
        onCropDialogChange={setShowCropDialog}
        onMeasureDialogChange={setShowMeasureDialog}
        onCropExtract={handleCropExtract}
        onCancelCrop={() => {
          if (cropRect && fabricCanvas) {
            fabricCanvas.remove(cropRect);
          }
          cancelCrop();
          setShowCropDialog(false);
          setMode("select");
        }}
        onMeasureSubmit={handleMeasureSubmit}
        onCancelMeasure={() => {
          if (measureLine && fabricCanvas) {
            fabricCanvas.remove(measureLine);
          }
          cancelMeasure();
          setShowMeasureDialog(false);
          setMode("select");
        }}
      />
    </div>
  );
};
