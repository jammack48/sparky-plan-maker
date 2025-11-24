import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Crop, Ruler, Grid3x3, Download, X, Eraser, Undo2, Redo2, ChevronDown, Settings, Lock, Unlock, Layers, RotateCcw, RotateCw, Square, Box, Palette, MousePointer2, Move } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AreaColorPicker } from "./AreaColorPicker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SymbolIcon } from "./SymbolIcon";

interface CanvasToolbarProps {
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
  onSymbolSelect: (symbolId: string) => void;
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
  onSelectAll: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotateBackgroundLeft: () => void;
  onRotateBackgroundRight: () => void;
}

export const CanvasToolbar = ({
  mode,
  scale,
  showGrid,
  lockBackground,
  showTitleBlock,
  hasSelection = false,
  gridSize,
  gridColor,
  gridThickness,
  gridOpacity,
  zoomLevel,
  undoStackLength,
  redoStackLength,
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
  onSelectAll,
  onRotateLeft,
  onRotateRight,
  onRotateBackgroundLeft,
  onRotateBackgroundRight,
}: CanvasToolbarProps) => {
  return (
    <Card className="p-2 sm:p-3 mb-2 sm:mb-3 overflow-x-auto relative z-10" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-max">
        <Button
          variant={mode === "select" ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
        >
          Select
        </Button>
        <Button
          variant={mode === "move" ? "default" : "outline"}
          size="sm"
          onClick={onMove}
        >
          Move
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={undoStackLength === 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={redoStackLength === 0}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button
          variant={mode === "crop" ? "default" : "outline"}
          size="sm"
          onClick={onCrop}
        >
          {mode === "crop" ? <X className="w-4 h-4 mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
          {mode === "crop" ? "Cancel" : "Crop"}
        </Button>
        <Button
          variant={mode === "measure" ? "default" : "outline"}
          size="sm"
          onClick={onMeasure}
        >
          {mode === "measure" ? <X className="w-4 h-4 mr-2" /> : <Ruler className="w-4 h-4 mr-2" />}
          {mode === "measure" ? "Cancel" : "Measure"}
        </Button>
        <Button
          variant={mode === "measure-area" ? "default" : "outline"}
          size="sm"
          onClick={onMeasureArea}
          disabled={!scale}
          title={!scale ? "Set scale first using Measure tool" : "Measure Area"}
        >
          <Square className="w-4 h-4 mr-2" />
          Area
        </Button>
        <Button
          variant={mode === "measure-volume" ? "default" : "outline"}
          size="sm"
          onClick={onMeasureVolume}
          disabled={!scale}
          title={!scale ? "Set scale first using Measure tool" : "Measure Volume"}
        >
          <Box className="w-4 h-4 mr-2" />
          Volume
        </Button>
        <Button
          variant={mode === "measure-distance" ? "default" : "outline"}
          size="sm"
          onClick={onMeasureDistance}
          disabled={!scale}
          title={!scale ? "Set scale first using Measure tool" : "Measure Distance"}
        >
          <Ruler className="w-4 h-4 mr-2" />
          Distance
        </Button>
        {(mode === "measure-area" || mode === "measure-volume") && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                Area Color
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <AreaColorPicker 
                color={areaColor}
                opacity={areaOpacity}
                onColorChange={onAreaColorChange}
                onOpacityChange={onAreaOpacityChange}
              />
            </PopoverContent>
          </Popover>
        )}
        {mode === "measure-distance" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Color:</Label>
            <input
              type="color"
              value={distanceColor}
              onChange={(e) => onDistanceColorChange(e.target.value)}
              className="h-8 w-12 border rounded bg-background"
            />
          </div>
        )}
        <Button
          variant={mode === "erase" ? "default" : "outline"}
          size="sm"
          onClick={onErase}
        >
          <Eraser className="w-4 h-4 mr-2" />
          Erase
        </Button>
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={onToggleGrid}
          disabled={!scale}
        >
          <Grid3x3 className="w-4 h-4 mr-2" />
          Grid
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!scale} aria-label="Grid settings">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 w-64">
            <div className="p-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Color</Label>
                <input
                  type="color"
                  value={gridColor}
                  onChange={(e) => onGridColorChange(e.target.value)}
                  className="h-8 w-12 border rounded bg-background"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Thickness (px)</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={gridThickness}
                  onChange={(e) => onGridThicknessChange(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Opacity</Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={gridOpacity}
                  onChange={(e) => onGridOpacityChange(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(gridOpacity * 100)}%</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {showGrid && (
          <div className="flex items-center gap-2 ml-4">
            <Label htmlFor="gridSize" className="text-sm whitespace-nowrap">
              Grid (mm):
            </Label>
            <Input
              id="gridSize"
              type="number"
              value={gridSize}
              onChange={(e) => onGridSizeChange(e.target.value)}
              className="w-20"
            />
          </div>
        )}
        <Button
          variant={lockBackground ? "outline" : "default"}
          size="sm"
          onClick={() => onLockBackground(!lockBackground)}
          title={lockBackground ? "Background Locked - Click to Unlock" : "Background Unlocked - Click to Lock"}
        >
          {lockBackground ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
          {lockBackground ? "Locked" : "Unlocked"}
        </Button>
        <Button
          variant={hasSelection ? "default" : "outline"}
          size="sm"
          onClick={onSelectAll}
          title="Select All (excludes background when locked)"
        >
          <Layers className="w-4 h-4 mr-2" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateLeft}
          title="Rotate selection 90° CCW"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateRight}
          title="Rotate selection 90° CW"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <Switch
            id="title-block-toggle"
            checked={showTitleBlock}
            onCheckedChange={onToggleTitleBlock}
          />
          <Label htmlFor="title-block-toggle" className="text-sm whitespace-nowrap cursor-pointer">
            Title Block
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPageSetup}
        >
          <Settings className="w-4 h-4 mr-2" />
          Page Setup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </Card>
  );
};
