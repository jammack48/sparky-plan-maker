import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SymbolIcon } from "./SymbolIcon";
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
  RotateCw
} from "lucide-react";

interface MobileToolbarProps {
  mode: "none" | "select" | "move" | "crop" | "measure" | "erase" | "place-symbol" | "draw";
  scale: number | null;
  showGrid: boolean;
  lockBackground: boolean;
  showTitleBlock: boolean;
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
  onErase: () => void;
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
  onErase,
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
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1 p-2 bg-background border-l border-y rounded-l-lg shadow-lg max-h-[80vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      {/* Symbols Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={mode === "place-symbol" ? "default" : "outline"} size="sm" className="shrink-0">
            Symbols <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-50 w-64 max-h-[60vh] overflow-y-auto bg-background">
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

      {/* Tools Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            Tools <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 w-48 bg-background">
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
          <DropdownMenuItem onClick={onMeasure}>
            {mode === "measure" ? <X className="mr-2 h-4 w-4" /> : <Ruler className="mr-2 h-4 w-4" />}
            <span>{mode === "measure" ? "Cancel Measure" : "Measure"}</span>
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
      <div className="flex flex-col items-center gap-1 pt-2 border-t text-xs text-muted-foreground whitespace-nowrap">
        {scale && (
          <span>1:{(1 / scale).toFixed(1)}</span>
        )}
        <span>{(zoomLevel * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
