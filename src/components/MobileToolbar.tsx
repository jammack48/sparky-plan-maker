import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SymbolIcon } from "./SymbolIcon";
import { AreaColorPicker } from "./AreaColorPicker";
import {
  MousePointer2, 
  Move, 
  Crop, 
  Ruler, 
  Eraser,
  Grid3x3,
  ChevronDown,
  Settings,
  Download,
  Undo2,
  Redo2,
  X,
  Lock,
  Unlock,
  Layers,
  RotateCcw,
  RotateCw,
  GripVertical,
  Square,
  Box
} from "lucide-react";

interface MobileToolbarProps {
  mode: "none" | "select" | "move" | "crop" | "measure" | "measure-area" | "measure-volume" | "measure-distance" | "erase" | "place-symbol" | "draw";
  scale: number | null;
  showGrid: boolean;
  lockBackground: boolean;
  showTitleBlock: boolean;
  hasSelection?: boolean;
  gridSize: string;
  gridColor: string;
  gridThickness: number;
  gridOpacity: number;
  zoomLevel: number;
  undoStackLength: number;
  redoStackLength: number;
  symbolCategories: { name: string; symbols: { id: string; name: string }[] }[];
  selectedSymbol: string | null;
  onSelect: () => void;
  onMove: () => void;
  onCrop: () => void;
  onMeasure: () => void;
  onMeasureArea: () => void;
  onMeasureVolume: () => void;
  onMeasureDistance: () => void;
  onErase: () => void;
  areaColor: string;
  areaOpacity: number;
  onAreaColorChange: (color: string) => void;
  onAreaOpacityChange: (opacity: number) => void;
  distanceColor: string;
  onDistanceColorChange: (color: string) => void;
  onToggleGrid: () => void;
  onToggleTitleBlock: (show: boolean) => void;
  onLockBackground: (locked: boolean) => void;
  onGridSizeChange: (value: string) => void;
  onGridColorChange: (value: string) => void;
  onGridThicknessChange: (value: number) => void;
  onGridOpacityChange: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onPageSetup: () => void;
  onSymbolSelect: (symbolId: string) => void;
  onSelectAll: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotateBackgroundLeft: () => void;
  onRotateBackgroundRight: () => void;
}

export const MobileToolbar = ({
  mode,
  scale,
  showGrid,
  lockBackground,
  showTitleBlock,
  gridSize,
  gridColor,
  gridThickness,
  gridOpacity,
  zoomLevel,
  undoStackLength,
  redoStackLength,
  symbolCategories,
  selectedSymbol,
  onSelect,
  onMove,
  onCrop,
  onMeasure,
  onMeasureArea,
  onMeasureVolume,
  onMeasureDistance,
  onErase,
  areaColor,
  areaOpacity,
  onAreaColorChange,
  onAreaOpacityChange,
  distanceColor,
  onDistanceColorChange,
  onToggleGrid,
  onToggleTitleBlock,
  onLockBackground,
  onGridSizeChange,
  onGridColorChange,
  onGridThicknessChange,
  onGridOpacityChange,
  onUndo,
  onRedo,
  onExport,
  onPageSetup,
  onSymbolSelect,
  onSelectAll,
  onRotateLeft,
  onRotateRight,
  onRotateBackgroundLeft,
  onRotateBackgroundRight,
}: MobileToolbarProps) => {
  // Draggable toolbar state (landscape mode only)
  const [toolbarPosition, setToolbarPosition] = useState(() => {
    const saved = localStorage.getItem('toolbar-position');
    return saved ? JSON.parse(saved) : { x: Math.max(20, window.innerWidth / 2 - 120), y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (window.innerWidth <= window.innerHeight) return; // Portrait mode - no dragging
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragOffset({
      x: clientX - toolbarPosition.x,
      y: clientY - toolbarPosition.y
    });
  };

  const handleDragMove = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 260, clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 200, clientY - dragOffset.y));
    
    setToolbarPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    localStorage.setItem('toolbar-position', JSON.stringify(toolbarPosition));
  };

  // Set up event listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragOffset, toolbarPosition]);

  // Helper function to get the display name for the selected symbol
  const getSymbolDisplayName = () => {
    if (mode === "place-symbol" && selectedSymbol) {
      for (const category of symbolCategories) {
        const symbol = category.symbols.find((s: any) => s.id === selectedSymbol);
        if (symbol) return symbol.name;
      }
    }
    return "Symbols";
  };

  // Helper function to get the display name for the active tool
  const getToolDisplayName = () => {
    const modeNames: Record<string, string> = {
      "select": "Select",
      "move": "Move",
      "crop": "Crop",
      "measure": "Measure",
      "measure-area": "Measure Area",
      "measure-volume": "Measure Volume",
      "erase": "Erase",
      "draw": "Draw",
      "place-symbol": "Place Symbol",
      "none": "Tools"
    };
    return modeNames[mode] || "Tools";
  };

  const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

  return (
    <div 
      className="w-full min-w-0 flex portrait:items-center portrait:gap-1 portrait:p-2 portrait:px-3 portrait:bg-background portrait:border-b portrait:overflow-x-auto portrait:relative landscape:fixed landscape:z-50 landscape:flex-col landscape:gap-1 landscape:p-3 landscape:bg-background landscape:border landscape:rounded-lg landscape:shadow-lg landscape:max-h-[85vh] landscape:min-w-[240px] landscape:w-auto landscape:overflow-y-auto"
      style={
        isLandscape
          ? {
              position: 'fixed',
              transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              top: 0,
              left: 0,
            }
          : undefined
      }
      onMouseDown={(e) => e.stopPropagation()} 
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Drag handle in landscape mode */}
      {isLandscape && (
        <div 
          className="flex justify-center py-1.5 -mx-3 -mt-3 mb-2 cursor-move touch-none bg-muted/50 rounded-t-lg border-b"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      
      {/* Mark Up Dropdown - Symbols + Area/Volume */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={mode === "place-symbol" || mode === "measure" || mode === "measure-area" || mode === "measure-volume" || mode === "measure-distance" ? "default" : "outline"} size="sm" className="shrink-0 min-w-fit">
            <span className="portrait:hidden landscape:inline">Mark Up</span>
            <span className="portrait:inline landscape:hidden">Symbols & Tools</span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[100] w-64 max-h-[60vh] overflow-y-auto bg-background border shadow-lg">
          <Accordion type="single" collapsible className="w-full">
            {symbolCategories.map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger className="px-4 py-2 text-sm hover:bg-muted/50">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {category.symbols.map((symbol) => (
                      <button
                        key={symbol.id}
                        onClick={() => onSymbolSelect(symbol.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded hover:bg-muted/50 transition-colors ${
                          selectedSymbol === symbol.id ? "bg-muted" : ""
                        }`}
                      >
                        <SymbolIcon type={symbol.id} size={24} />
                        <span className="text-xs text-center break-words">{symbol.name}</span>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="border-t mt-2 pt-2 px-2">
            <div className="space-y-2">
              <DropdownMenuItem onClick={onMeasure}>
                <Ruler className="mr-2 h-4 w-4" />
                <span>{mode === "measure" ? "Cancel Set Scale" : "Set Scale"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMeasureArea} disabled={!scale}>
                <Square className="mr-2 h-4 w-4" />
                <span>Measure Area {!scale && "(Set scale first)"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMeasureVolume} disabled={!scale}>
                <Box className="mr-2 h-4 w-4" />
                <span>Measure Volume {!scale && "(Set scale first)"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMeasureDistance} disabled={!scale}>
                <Ruler className="mr-2 h-4 w-4" />
                <span>Measure Distance {!scale && "(Set scale first)"}</span>
              </DropdownMenuItem>
            </div>
            
            {/* Color Bar for Area/Volume */}
            {(mode === "measure-area" || mode === "measure-volume") && (
              <div className="mt-3 pt-3 border-t">
                <Label className="text-xs mb-2 block">Area/Volume Color</Label>
                <AreaColorPicker 
                  color={areaColor}
                  opacity={areaOpacity}
                  onColorChange={onAreaColorChange}
                  onOpacityChange={onAreaOpacityChange}
                />
              </div>
            )}
            
            {/* Color Picker for Distance */}
            {mode === "measure-distance" && (
              <div className="mt-3 pt-3 border-t">
                <Label className="text-xs mb-2 block">Distance Color</Label>
                <input
                  type="color"
                  value={distanceColor}
                  onChange={(e) => onDistanceColorChange(e.target.value)}
                  className="h-8 w-full border rounded bg-background"
                />
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lock/Unlock Background */}
      <Button
        variant={lockBackground ? "outline" : "default"}
        size="sm"
        onClick={() => onLockBackground(!lockBackground)}
        className="shrink-0"
        title={lockBackground ? "Background Locked" : "Background Unlocked"}
      >
        {lockBackground ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>

      {/* Undo/Redo */}
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={undoStackLength === 0}
        className="shrink-0"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={redoStackLength === 0}
        className="shrink-0"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      {/* Selections Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0 min-w-fit">
            <span className="portrait:hidden landscape:inline">Selections</span>
            <span className="portrait:inline landscape:hidden">Tools</span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] w-48 bg-background border shadow-lg">
          <DropdownMenuItem onClick={onSelect}>
            <MousePointer2 className="mr-2 h-4 w-4" />
            <span>Select</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMove}>
            <Move className="mr-2 h-4 w-4" />
            <span>Move</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCrop}>
            {mode === "crop" ? <X className="mr-2 h-4 w-4" /> : <Crop className="mr-2 h-4 w-4" />}
            <span>{mode === "crop" ? "Cancel Crop" : "Crop"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onErase}>
            <Eraser className="mr-2 h-4 w-4" />
            <span>Erase</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectAll}>
            <Layers className="mr-2 h-4 w-4" />
            <span>Select All</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRotateLeft}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Rotate Selection CCW</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRotateRight}>
            <RotateCw className="mr-2 h-4 w-4" />
            <span>Rotate Selection CW</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRotateBackgroundLeft}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Rotate Background CCW</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRotateBackgroundRight}>
            <RotateCw className="mr-2 h-4 w-4" />
            <span>Rotate Background CW</span>
          </DropdownMenuItem>
          <div className="px-2 py-2 border-t mt-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="mobile-lock-bg" className="text-sm">Lock Background</Label>
              <Switch
                id="mobile-lock-bg"
                checked={lockBackground}
                onCheckedChange={onLockBackground}
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="mobile-grid" className="text-sm">Show Grid</Label>
              <Switch
                id="mobile-grid"
                checked={showGrid}
                onCheckedChange={onToggleGrid}
                disabled={!scale}
              />
            </div>
            {showGrid && (
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="mobile-gridSize" className="text-xs whitespace-nowrap">
                  Grid (mm):
                </Label>
                <Input
                  id="mobile-gridSize"
                  type="number"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            )}
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Grid Color</Label>
                <input
                  type="color"
                  value={gridColor}
                  onChange={(e) => onGridColorChange(e.target.value)}
                  className="h-6 w-10 border rounded bg-background"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Thickness</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={gridThickness}
                  onChange={(e) => onGridThicknessChange(Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacity</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={gridOpacity}
                    onChange={(e) => onGridOpacityChange(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground w-8">{Math.round(gridOpacity * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Label htmlFor="mobile-title" className="text-sm">Title Block</Label>
              <Switch
                id="mobile-title"
                checked={showTitleBlock}
                onCheckedChange={onToggleTitleBlock}
              />
            </div>
          </div>
          <DropdownMenuItem onClick={onPageSetup} className="mt-2">
            <Settings className="mr-2 h-4 w-4" />
            <span>Page Setup</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Scale and Zoom */}
      <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 min-w-fit portrait:ml-auto landscape:w-full landscape:text-center landscape:pt-2 landscape:border-t">
        <div className="landscape:flex landscape:flex-col landscape:gap-0.5 portrait:flex portrait:items-center portrait:gap-2">
          {scale ? (
            <span className="portrait:inline landscape:block">Scale: 1:{(1 / scale).toFixed(1)}</span>
          ) : (
            <span className="portrait:inline landscape:block">No scale</span>
          )}
          <span className="portrait:inline landscape:block">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
