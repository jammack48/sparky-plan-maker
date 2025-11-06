import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Point, Rect as FabricRect, FabricText, Group, PencilBrush } from "fabric";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasDialogs } from "./CanvasDialogs";
import { GridOverlay } from "./GridOverlay";
import { useCropMode } from "@/hooks/useCropMode";
import { useMeasureMode } from "@/hooks/useMeasureMode";
import { useEraseMode } from "@/hooks/useEraseMode";
import { useSymbolPlacement } from "@/hooks/useSymbolPlacement";
import { useSymbolCreation } from "@/hooks/useSymbolCreation";
import { useDrawMode } from "@/hooks/useDrawMode";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PageSetup } from "@/types/pageSetup";
import { toast } from "sonner";

export interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: (canvasDataUrl: string, imgWidth: number, imgHeight: number) => void;
  onExtract: (dataUrl: string) => void;
  onPageSetup: () => void;
  pageSetup: PageSetup;
  showTitleBlock: boolean;
  onToggleTitleBlock: (show: boolean) => void;
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
  onExport,
  onExtract,
  onPageSetup,
  pageSetup,
  showTitleBlock,
  onToggleTitleBlock,
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
  const panRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({ dragging: false, lastX: 0, lastY: 0 });
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"none" | "select" | "move" | "crop" | "measure" | "erase" | "place-symbol" | "draw">("select");
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState("400");
  const [gridColor, setGridColor] = useState("#ff0000");
  const [gridThickness, setGridThickness] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [scale, setScale] = useState<number | null>(null);
  const [bgScale, setBgScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const titleBlockGroupRef = useRef<Group | null>(null);
  const { createSymbol } = useSymbolCreation(symbolColor, symbolThickness, symbolTransparency, symbolScale);
  const { undoStack, redoStack, saveCanvasState, handleUndo, handleRedo } = useUndoRedo(fabricCanvas);

  // Use draw mode hook for shape drawing
  useDrawMode(fabricCanvas, mode, selectedSymbol, symbolColor, symbolThickness, symbolTransparency, saveCanvasState, onSymbolPlaced);

  useEffect(() => {
    if (selectedSymbol === "freehand" || selectedSymbol === "line" || selectedSymbol === "rectangle" || selectedSymbol === "circle") {
      setMode("draw");
    } else if (selectedSymbol === "text-label") {
      setMode("place-symbol"); // Text uses place-symbol mode
    } else if (selectedSymbol) {
      setMode("place-symbol");
    } else if (mode === "place-symbol" || mode === "draw") {
      setMode("select");
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundColor: "#ffffff",
        selection: true,
      });
      
      // Keep object stacking order stable (don't auto-bring active object to front)
      (canvas as any).preserveObjectStacking = true;

      // Ensure a working free drawing brush
      try {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = symbolColor;
        canvas.freeDrawingBrush.width = symbolThickness;
        console.info('[DRAW:init] brush ready', { color: canvas.freeDrawingBrush.color, width: canvas.freeDrawingBrush.width });
      } catch (e) {
        console.warn('[DRAW:init] failed to init brush', e);
      }

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

  // Enable freehand drawing when 'freehand' tool is selected  
  // Note: Shape drawing (line, rectangle, circle) is handled by useDrawMode hook
  useEffect(() => {
    if (!fabricCanvas) return;
    // Drawing mode is managed by useDrawMode hook
  }, [fabricCanvas, mode, symbolColor, symbolThickness]);

  // Remove old path:created handler as it's now in useDrawMode
  useEffect(() => {
    // Removed - now handled by useDrawMode
  }, [fabricCanvas, onSymbolPlaced]);

  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
    } catch (e) {
      console.error("Canvas clear error:", e);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Store original image dimensions
      setOriginalImageSize({ width: img.width, height: img.height });

      const fabricImage = new FabricImage(img, {
        left: 0,
        top: 0,
        selectable: true,
        evented: true,
        hasControls: true,
        objectCaching: true,
        hoverCursor: "default",
        moveCursor: "default",
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

  // Create title block as Fabric objects
  useEffect(() => {
    if (!fabricCanvas || !showTitleBlock) {
      // Remove title block if it exists
      if (titleBlockGroupRef.current) {
        fabricCanvas?.remove(titleBlockGroupRef.current);
        titleBlockGroupRef.current = null;
      }
      return;
    }

    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    const titleBarHeight = pageSetup.layout.titleBarHeight;
    const logoSize = (pageSetup.layout.logoSize / 100) * titleBarHeight;

    // Remove existing title block
    if (titleBlockGroupRef.current) {
      fabricCanvas.remove(titleBlockGroupRef.current);
    }

    const objects: any[] = [];

    // White background
    const bg = new FabricRect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: titleBarHeight,
      fill: 'white',
      selectable: false,
      evented: false,
    });
    objects.push(bg);

    // Black border around title block
    const border = new FabricRect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: titleBarHeight,
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    objects.push(border);

    let logoSectionWidth = 0;

    // Logo if provided
    if (pageSetup.logo) {
      const img = new Image();
      img.onload = () => {
        const fabricLogo = new FabricImage(img, {
          left: logoSize * 0.25,
          top: (titleBarHeight - logoSize) / 2,
          scaleX: logoSize / img.width,
          scaleY: logoSize / img.height,
          selectable: false,
          evented: false,
        });
        objects.push(fabricLogo);

        // Logo separator
        logoSectionWidth = logoSize * 1.5;
        const logoSep = new FabricRect({
          left: logoSectionWidth,
          top: 0,
          width: 2,
          height: titleBarHeight,
          fill: 'black',
          selectable: false,
          evented: false,
        });
        objects.push(logoSep);

        finalizeTitleBlock();
      };
      img.src = pageSetup.logo;
    } else {
      finalizeTitleBlock();
    }

    function finalizeTitleBlock() {
      const tableStartX = logoSectionWidth;
      const tableWidth = canvasWidth - logoSectionWidth;
      const col1Width = tableWidth / 2;
      const rowHeight = titleBarHeight / 3;

      // Vertical separator between columns
      const colSep = new FabricRect({
        left: tableStartX + col1Width,
        top: 0,
        width: 1,
        height: titleBarHeight,
        fill: 'black',
        selectable: false,
        evented: false,
      });
      objects.push(colSep);

      // Horizontal separators
      const row1Sep = new FabricRect({
        left: tableStartX,
        top: rowHeight,
        width: tableWidth,
        height: 1,
        fill: 'black',
        selectable: false,
        evented: false,
      });
      objects.push(row1Sep);

      const row2Sep = new FabricRect({
        left: tableStartX,
        top: rowHeight * 2,
        width: tableWidth,
        height: 1,
        fill: 'black',
        selectable: false,
        evented: false,
      });
      objects.push(row2Sep);

      // Text styling
      const labelStyle = { fontSize: 10, fill: 'black', fontWeight: 'bold', fontFamily: 'Arial' };
      const valueStyle = { fontSize: 12, fill: 'black', fontFamily: 'Arial' };

      // Row 1, Column 1: Client
      const clientLabel = new FabricText('CLIENT:', { ...labelStyle, left: tableStartX + 5, top: rowHeight * 0 + rowHeight / 2 - 6, selectable: false, evented: false });
      const clientValue = new FabricText(pageSetup.title || '', { ...valueStyle, left: tableStartX + 60, top: rowHeight * 0 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(clientLabel, clientValue);

      // Row 2, Column 1: Description
      const descLabel = new FabricText('DESCRIPTION:', { ...labelStyle, left: tableStartX + 5, top: rowHeight * 1 + rowHeight / 2 - 6, selectable: false, evented: false });
      const descValue = new FabricText(pageSetup.subtitle || 'Floor Plan', { ...valueStyle, left: tableStartX + 100, top: rowHeight * 1 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(descLabel, descValue);

      // Row 3, Column 1: Job Address
      const addrLabel = new FabricText('JOB ADDRESS:', { ...labelStyle, left: tableStartX + 5, top: rowHeight * 2 + rowHeight / 2 - 6, selectable: false, evented: false });
      const addrValue = new FabricText(pageSetup.details || '', { ...valueStyle, left: tableStartX + 100, top: rowHeight * 2 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(addrLabel, addrValue);

      // Row 1, Column 2: File name
      const fileLabel = new FabricText('FILE NAME:', { ...labelStyle, left: tableStartX + col1Width + 5, top: rowHeight * 0 + rowHeight / 2 - 6, selectable: false, evented: false });
      const fileValue = new FabricText(pageSetup.footer || 'floor_plan.pdf', { ...valueStyle, left: tableStartX + col1Width + 80, top: rowHeight * 0 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(fileLabel, fileValue);

      // Row 2, Column 2: Date
      const dateLabel = new FabricText('DATE:', { ...labelStyle, left: tableStartX + col1Width + 5, top: rowHeight * 1 + rowHeight / 2 - 6, selectable: false, evented: false });
      const dateValue = new FabricText(new Date().toLocaleDateString(), { ...valueStyle, left: tableStartX + col1Width + 50, top: rowHeight * 1 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(dateLabel, dateValue);

      // Row 3, Column 2: Sheet
      const sheetLabel = new FabricText('SHEET:', { ...labelStyle, left: tableStartX + col1Width + 5, top: rowHeight * 2 + rowHeight / 2 - 6, selectable: false, evented: false });
      const sheetValue = new FabricText('1 of 1', { ...valueStyle, left: tableStartX + col1Width + 55, top: rowHeight * 2 + rowHeight / 2 - 7, selectable: false, evented: false });
      objects.push(sheetLabel, sheetValue);

      // Create group and position at bottom
      const group = new Group(objects, {
        left: 0,
        top: canvasHeight - titleBarHeight,
        selectable: false,
        evented: false,
        excludeFromExport: false,
      });

      fabricCanvas.add(group);
      fabricCanvas.bringObjectToFront(group);
      titleBlockGroupRef.current = group;
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, showTitleBlock, pageSetup]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Prevent right-click context menu
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    fabricCanvas.upperCanvasEl?.addEventListener("contextmenu", preventContextMenu);

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
    };

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      // Disable panning in tool modes
      if (mode === "crop" || mode === "measure" || mode === "erase" || mode === "place-symbol" || mode === "draw") return;
      // Space+Left pans via Fabric events; right-button handled by DOM below
      if (isSpacePressed && e.button === 0) {
        e.preventDefault();
        (fabricCanvas as any).isDragging = true;
        panRef.current.dragging = true;
        panRef.current.lastX = e.clientX;
        panRef.current.lastY = e.clientY;
        setIsPanning(true);
        fabricCanvas.selection = false;
        fabricCanvas.defaultCursor = "grabbing";
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!panRef.current.dragging) return;
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        const dx = opt.e.clientX - panRef.current.lastX;
        const dy = opt.e.clientY - panRef.current.lastY;
        vpt[4] += dx;
        vpt[5] += dy;
        fabricCanvas.requestRenderAll();
        panRef.current.lastX = opt.e.clientX;
        panRef.current.lastY = opt.e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (!panRef.current.dragging) return;
      fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
      (fabricCanvas as any).isDragging = false;
      panRef.current.dragging = false;
      setIsPanning(false);
      fabricCanvas.selection = true;
      const toolModes = ["crop", "measure", "erase", "place-symbol", "draw"];
      fabricCanvas.defaultCursor = toolModes.includes(mode) ? "crosshair" : "default";
    };

    fabricCanvas.on("mouse:wheel", handleWheel);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    // DOM listeners for right-button and middle-button pan
    const el = fabricCanvas.upperCanvasEl as HTMLCanvasElement | null;
    if (!el) {
      return () => {
        fabricCanvas.upperCanvasEl?.removeEventListener("contextmenu", preventContextMenu);
        fabricCanvas.off("mouse:wheel", handleWheel);
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:up", handleMouseUp);
      };
    }
    const domDown = (e: MouseEvent) => {
      // Disable panning in tool modes
      if (mode === "crop" || mode === "measure" || mode === "erase" || mode === "place-symbol" || mode === "draw") return;
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        panRef.current.dragging = true;
        panRef.current.lastX = e.clientX;
        panRef.current.lastY = e.clientY;
        setIsPanning(true);
        fabricCanvas.selection = false;
        fabricCanvas.defaultCursor = 'grabbing';
      }
    };
    const domMove = (e: MouseEvent) => {
      if (!panRef.current.dragging) return;
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        const dx = e.clientX - panRef.current.lastX;
        const dy = e.clientY - panRef.current.lastY;
        vpt[4] += dx;
        vpt[5] += dy;
        fabricCanvas.requestRenderAll();
        panRef.current.lastX = e.clientX;
        panRef.current.lastY = e.clientY;
      }
    };
    const domUp = () => {
      if (!panRef.current.dragging) return;
      fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
      panRef.current.dragging = false;
      setIsPanning(false);
      fabricCanvas.selection = true;
      const toolModes = ["crop", "measure", "erase", "place-symbol", "draw"];
      fabricCanvas.defaultCursor = toolModes.includes(mode) ? 'crosshair' : 'default';
    };
    el.addEventListener('mousedown', domDown);
    window.addEventListener('mousemove', domMove);
    window.addEventListener('mouseup', domUp);

    return () => {
      fabricCanvas.upperCanvasEl?.removeEventListener("contextmenu", preventContextMenu);
      fabricCanvas.off("mouse:wheel", handleWheel);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      el.removeEventListener('mousedown', domDown);
      window.removeEventListener('mousemove', domMove);
      window.removeEventListener('mouseup', domUp);
    };
  }, [fabricCanvas, mode, scale, showGrid, gridSize, isSpacePressed]);

  // Spacebar pan key handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If editing a text object, allow space to type
      const active = fabricCanvas?.getActiveObject() as any;
      const isEditingText = active && (active.isEditing || active.type === 'i-text' && active.__charBounds);
      if (isEditingText) return;

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        setIsSpacePressed(true);
        // prevent page scroll
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // If editing a text object, ignore
      const active = fabricCanvas?.getActiveObject() as any;
      const isEditingText = active && (active.isEditing || active.type === 'i-text' && active.__charBounds);
      if (isEditingText) return;

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
  }, [fabricCanvas]);

  // Update cursor when holding space (not dragging)
  useEffect(() => {
    if (!fabricCanvas) return;
    if ((fabricCanvas as any).isDragging) return;
    
    let cursor = 'default';
    const toolModes = ["crop", "measure", "erase", "place-symbol", "draw"];
    if (isSpacePressed) {
      cursor = 'grab';
    } else if (toolModes.includes(mode)) {
      cursor = 'crosshair';
    }
    
    fabricCanvas.defaultCursor = cursor;
  }, [fabricCanvas, isSpacePressed, mode]);

  // Touch gesture support for pinch zoom and two-finger pan
  useEffect(() => {
    if (!fabricCanvas) return;
    const el = fabricCanvas.upperCanvasEl as HTMLCanvasElement;
    if (!el) return;

    let touchState = {
      active: false,
      initialDistance: 0,
      initialZoom: 1,
      lastCenter: { x: 0, y: 0 },
      touches: [] as Touch[]
    };

    const getTouchDistance = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchState.active = true;
        touchState.initialDistance = getTouchDistance(t1, t2);
        touchState.initialZoom = fabricCanvas.getZoom();
        touchState.lastCenter = getTouchCenter(t1, t2);
        touchState.touches = [t1, t2];
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchState.active || e.touches.length !== 2) return;
      e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = getTouchDistance(t1, t2);
      const currentCenter = getTouchCenter(t1, t2);

      // Pinch zoom
      const scale = currentDistance / touchState.initialDistance;
      const newZoom = Math.min(Math.max(0.1, touchState.initialZoom * scale), 20);
      
      // Get canvas-relative center point
      const rect = el.getBoundingClientRect();
      const centerPoint = new Point(
        currentCenter.x - rect.left,
        currentCenter.y - rect.top
      );
      
      fabricCanvas.zoomToPoint(centerPoint, newZoom);

      // Two-finger pan
      const dx = currentCenter.x - touchState.lastCenter.x;
      const dy = currentCenter.y - touchState.lastCenter.y;
      
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        vpt[4] += dx;
        vpt[5] += dy;
      }

      touchState.lastCenter = currentCenter;
      fabricCanvas.requestRenderAll();
      setZoom(newZoom);
      setGridUpdateTrigger(prev => prev + 1);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchState.active) {
        touchState.active = false;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [fabricCanvas]);
  useEffect(() => {
    if (!fabricCanvas || !scale || !showGrid) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj || (obj as any).isPreview) return;

      // Check if we should snap: Ctrl/Meta key on desktop OR always on touch devices when grid is shown
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const shouldSnap = isTouchDevice || e.e.ctrlKey || e.e.metaKey;

      if (shouldSnap) {
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
    
    // Remove the crop rectangle before exporting to avoid blue outline
    fabricCanvas.remove(cropRect);
    fabricCanvas.renderAll();
    
    const dataUrl = fabricCanvas.toDataURL({
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.width! * cropRect.scaleX!,
      height: cropRect.height! * cropRect.scaleY!,
      multiplier: bgScale ? 1 / bgScale : 1,
    });
    onExtract(dataUrl);
    cancelCrop();
    setShowCropDialog(false);
    setMode("select");
  }, [fabricCanvas, cropRect, onExtract, cancelCrop, bgScale]);

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

  const handleExportPDF = useCallback(() => {
    if (!fabricCanvas) return;
    
    // Export full canvas including title block at original resolution
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
    
    onExport(dataUrl, originalImageSize.width, originalImageSize.height);
  }, [fabricCanvas, originalImageSize, onExport]);

  const gridSpacing = scale && showGrid ? parseFloat(gridSize) * scale * zoom : 0;

  const handleModeChange = (newMode: "crop" | "measure" | "erase") => {
    if (mode === newMode) {
      setMode("select");
    } else {
      setMode(newMode);
    }
  };

  const handleSelectMode = () => {
    if (mode === "select") {
      // Toggle off select: clear selection and show no active tool
      if (fabricCanvas) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
      }
      setMode("none");
    } else {
      setMode("select");
      if (onSymbolDeselect) {
        onSymbolDeselect();
      }
    }
  };

  const handleMoveMode = () => {
    if (mode === "move") {
      if (fabricCanvas) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
      }
      setMode("none");
    } else {
      setMode("move");
      if (onSymbolDeselect) {
        onSymbolDeselect();
      }
    }
  };

  // Handle object selection controls based on mode
  // Control canvas selection and object selectability based on mode
  useEffect(() => {
    if (!fabricCanvas) return;

    const disableInteractivity = mode === "place-symbol" || mode === "draw";
    fabricCanvas.selection = !disableInteractivity ? true : false;
    fabricCanvas.skipTargetFind = disableInteractivity; // prevents selection/drag

    fabricCanvas.getObjects().forEach((obj: any) => {
      obj.selectable = !disableInteractivity;
      obj.evented = !disableInteractivity;
    });

    console.info("[MODE]", { mode, selection: fabricCanvas.selection, skipTargetFind: fabricCanvas.skipTargetFind });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, mode]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleSelection = () => {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        if (mode === "move") {
          // In move mode: hide controls but allow movement
          activeObject.hasControls = false;
          activeObject.hasBorders = true;
          activeObject.lockRotation = true;
          activeObject.lockScalingX = true;
          activeObject.lockScalingY = true;
        } else if (mode === "select") {
          // In select mode: show all controls
          activeObject.hasControls = true;
          activeObject.hasBorders = true;
          activeObject.lockRotation = false;
          activeObject.lockScalingX = false;
          activeObject.lockScalingY = false;
        }
        fabricCanvas.requestRenderAll();
      }
    };

    fabricCanvas.on("selection:created", handleSelection);
    fabricCanvas.on("selection:updated", handleSelection);

    // Also update currently selected object when mode changes
    handleSelection();

    return () => {
      fabricCanvas.off("selection:created", handleSelection);
      fabricCanvas.off("selection:updated", handleSelection);
    };
  }, [fabricCanvas, mode]);

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
        onSelect={handleSelectMode}
        onMove={handleMoveMode}
        onCrop={() => handleModeChange("crop")}
        onMeasure={() => handleModeChange("measure")}
        onErase={() => handleModeChange("erase")}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showTitleBlock={showTitleBlock}
        onToggleTitleBlock={onToggleTitleBlock}
        onGridSizeChange={setGridSize}
        onGridColorChange={setGridColor}
        onGridThicknessChange={setGridThickness}
        onGridOpacityChange={setGridOpacity}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExportPDF}
        onPageSetup={onPageSetup}
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
