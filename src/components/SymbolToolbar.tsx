import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Palette, Minus, Eye, Maximize, Zap, Droplet, Wind, Type, Pencil as PencilIcon, Square, Circle as CircleIcon, Copy, Clipboard, Edit3, FolderInput, Image } from "lucide-react";
import { SymbolIcon } from "./SymbolIcon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from "@/components/ui/context-menu";
import { toast } from "sonner";

export interface SymbolType {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  category: "electrical" | "plumbing" | "hvac" | "text" | "draw" | "real-items";
}

export interface SymbolCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  symbols: SymbolType[];
}

interface SymbolToolbarProps {
  categories: SymbolCategory[];
  onSymbolSelect: (symbolId: string) => void;
  selectedSymbol: string | null;
  symbolColor: string;
  symbolThickness: number;
  symbolTransparency: number;
  symbolScale: number;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onTransparencyChange: (transparency: number) => void;
  onScaleChange: (scale: number) => void;
  colorHistory: string[];
  onCategoriesChange?: (categories: SymbolCategory[]) => void;
  scale?: number | null;
  zoomLevel?: number;
}

export const SymbolToolbar = ({ 
  categories, 
  onSymbolSelect, 
  selectedSymbol,
  symbolColor,
  symbolThickness,
  symbolTransparency,
  symbolScale,
  onColorChange,
  onThicknessChange,
  onTransparencyChange,
  onScaleChange,
  colorHistory,
  onCategoriesChange,
  scale,
  zoomLevel = 1
}: SymbolToolbarProps) => {
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<{ categoryId: string; symbolId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [copiedSymbol, setCopiedSymbol] = useState<{ symbol: SymbolType; sourceCategoryId: string } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const handleRenameSymbol = (categoryId: string, symbolId: string, newName: string) => {
    if (!onCategoriesChange || !newName.trim()) return;

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          symbols: cat.symbols.map(sym => 
            sym.id === symbolId ? { ...sym, name: newName.trim() } : sym
          )
        };
      }
      return cat;
    });

    onCategoriesChange(updatedCategories);
    toast.success("Symbol renamed");
  };

  const handleCopySymbol = (categoryId: string, symbolId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const symbol = category?.symbols.find(sym => sym.id === symbolId);
    
    if (symbol) {
      setCopiedSymbol({ symbol, sourceCategoryId: categoryId });
      toast.success("Symbol copied");
    }
  };

  const handlePasteSymbol = (targetCategoryId: string) => {
    if (!copiedSymbol || !onCategoriesChange) return;

    const updatedCategories = categories.map(cat => {
      if (cat.id === targetCategoryId) {
        const symbolExists = cat.symbols.some(sym => sym.id === copiedSymbol.symbol.id);
        if (symbolExists) {
          toast.error("Symbol already exists in this category");
          return cat;
        }

        return {
          ...cat,
          symbols: [...cat.symbols, { ...copiedSymbol.symbol, category: targetCategoryId as any }]
        };
      }
      return cat;
    });

    onCategoriesChange(updatedCategories);
    toast.success("Symbol pasted");
  };

  const handleStartEdit = (categoryId: string, symbolId: string, currentName: string) => {
    setEditingSymbol({ categoryId, symbolId });
    setEditValue(currentName);
    // Focus input after state update
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  };

  const handleFinishEdit = () => {
    if (editingSymbol && editValue.trim()) {
      handleRenameSymbol(editingSymbol.categoryId, editingSymbol.symbolId, editValue);
    }
    setEditingSymbol(null);
    setEditValue("");
  };

  const handleLongPressStart = (categoryId: string, symbolId: string, e: React.PointerEvent) => {
    e.preventDefault();
    longPressTimerRef.current = setTimeout(() => {
      const category = categories.find(cat => cat.id === categoryId);
      const symbol = category?.symbols.find(sym => sym.id === symbolId);
      if (symbol) {
        handleCopySymbol(categoryId, symbolId);
      }
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <Card className="p-2 sm:p-3 space-y-2 relative z-10 max-h-[50vh] portrait:max-h-[40vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-xs sm:text-sm text-foreground">Symbols</h3>
      </div>
      
      <Accordion 
        type="single" 
        collapsible 
        className="w-full overflow-y-auto flex-1"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id} className="border-b-0">
            <AccordionTrigger className="py-2 text-xs sm:text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                {category.icon}
                {category.name}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 pt-1">
                {category.symbols.map((symbol) => (
                  <ContextMenu key={symbol.id}>
                    <ContextMenuTrigger asChild>
                      <div 
                        className="relative"
                        onPointerDown={(e) => handleLongPressStart(category.id, symbol.id, e)}
                        onPointerUp={handleLongPressEnd}
                        onPointerLeave={handleLongPressEnd}
                      >
                        {editingSymbol?.categoryId === category.id && editingSymbol?.symbolId === symbol.id ? (
                          <div className="flex items-center gap-1 p-2 border rounded">
                            <Input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleFinishEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFinishEdit();
                                if (e.key === 'Escape') setEditingSymbol(null);
                              }}
                              className="h-7 text-xs"
                              autoFocus
                              inputMode="text"
                            />
                          </div>
                        ) : (
                          <Button
                            variant={selectedSymbol === symbol.id ? "default" : "outline"}
                            className={`w-full justify-between text-xs sm:text-sm ${selectedSymbol === symbol.id ? "ring-2 ring-primary" : ""}`}
                            size="sm"
                            onClick={() => onSymbolSelect(symbol.id)}
                            onDoubleClick={() => handleStartEdit(category.id, symbol.id, symbol.name)}
                          >
                            <span className="flex items-center gap-1 sm:gap-2">
                              {symbol.icon}
                              <span>{symbol.name}</span>
                            </span>
                            <span className="text-xs">{symbol.count}</span>
                          </Button>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleStartEdit(category.id, symbol.id, symbol.name)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleCopySymbol(category.id, symbol.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <FolderInput className="w-4 h-4 mr-2" />
                          Paste to...
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {categories.map(cat => (
                            <ContextMenuItem 
                              key={cat.id}
                              onClick={() => handlePasteSymbol(cat.id)}
                              disabled={!copiedSymbol}
                            >
                              {cat.icon}
                              <span className="ml-2">{cat.name}</span>
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Collapsible open={isStyleOpen} onOpenChange={setIsStyleOpen}>
        <div className="pt-2 border-t">
          <CollapsibleTrigger asChild className="portrait:flex landscape:hidden md:hidden w-full">
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-xs sm:text-sm">Style Controls</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="portrait:block landscape:hidden md:hidden mt-3">
          <div className="pt-3 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <Label htmlFor="symbol-color-mobile" className="text-sm">Color</Label>
              </div>
              <Input
                id="symbol-color-mobile"
                type="color"
                value={symbolColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="h-10 cursor-pointer"
              />
              {colorHistory.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {colorHistory.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => onColorChange(color)}
                      className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: color }}
                      title={`Recent color: ${color}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4" />
                <Label htmlFor="symbol-thickness-mobile" className="text-sm">Thickness</Label>
                <span className="ml-auto text-xs text-muted-foreground">{symbolThickness}px</span>
              </div>
              <Slider
                id="symbol-thickness-mobile"
                min={1}
                max={10}
                step={1}
                value={[symbolThickness]}
                onValueChange={(value) => onThicknessChange(value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <Label htmlFor="symbol-transparency-mobile" className="text-sm">Opacity</Label>
                <span className="ml-auto text-xs text-muted-foreground">{Math.round(symbolTransparency * 100)}%</span>
              </div>
              <Slider
                id="symbol-transparency-mobile"
                min={0}
                max={1}
                step={0.1}
                value={[symbolTransparency]}
                onValueChange={(value) => onTransparencyChange(value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4" />
                <Label htmlFor="symbol-scale-mobile" className="text-sm">Scale</Label>
                <span className="ml-auto text-xs text-muted-foreground">{symbolScale.toFixed(1)}x</span>
              </div>
              <Slider
                id="symbol-scale-mobile"
                min={0.5}
                max={3}
                step={0.1}
                value={[symbolScale]}
                onValueChange={(value) => onScaleChange(value[0])}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Scale and Zoom display at bottom */}
      <div className="pt-3 border-t mt-auto">
        <div className="space-y-2 text-xs text-muted-foreground">
          {scale && (
            <div className="flex justify-between items-center">
              <span>Scale:</span>
              <span className="font-medium">1:{(1 / scale).toFixed(1)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>Zoom:</span>
            <span className="font-medium">{(zoomLevel * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const DEFAULT_SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    id: "electrical",
    name: "Electrical",
    icon: <Zap className="h-4 w-4" />,
    symbols: [
      { id: "downlight", name: "Downlight", icon: <SymbolIcon type="downlight" />, count: 0, category: "electrical" },
      { id: "power-point", name: "Power Point", icon: <SymbolIcon type="power-point" />, count: 0, category: "electrical" },
      { id: "single-switch", name: "Single Switch", icon: <SymbolIcon type="single-switch" />, count: 0, category: "electrical" },
      { id: "double-switch", name: "Double Switch", icon: <SymbolIcon type="double-switch" />, count: 0, category: "electrical" },
      { id: "triple-switch", name: "Triple Switch", icon: <SymbolIcon type="triple-switch" />, count: 0, category: "electrical" },
      { id: "fan", name: "Fan", icon: <SymbolIcon type="fan" />, count: 0, category: "electrical" },
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: <Droplet className="h-4 w-4" />,
    symbols: [
      { id: "sink", name: "Sink", icon: <SymbolIcon type="downlight" />, count: 0, category: "plumbing" },
      { id: "toilet", name: "Toilet", icon: <SymbolIcon type="power-point" />, count: 0, category: "plumbing" },
      { id: "shower", name: "Shower", icon: <SymbolIcon type="single-switch" />, count: 0, category: "plumbing" },
    ]
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: <Wind className="h-4 w-4" />,
    symbols: [
      { id: "indoor-unit", name: "Indoor Unit", icon: <SymbolIcon type="indoor-unit" />, count: 0, category: "hvac" },
      { id: "supply-grill", name: "Supply Grill", icon: <SymbolIcon type="supply-grill" />, count: 0, category: "hvac" },
      { id: "return-grill", name: "Return Grill", icon: <SymbolIcon type="return-grill" />, count: 0, category: "hvac" },
    ]
  },
  {
    id: "text",
    name: "Text",
    icon: <Type className="h-4 w-4" />,
    symbols: [
      { id: "text-label", name: "Text Label", icon: <Type className="h-4 w-4" />, count: 0, category: "text" },
    ]
  },
  {
    id: "draw",
    name: "Draw",
    icon: <PencilIcon className="h-4 w-4" />,
    symbols: [
      { id: "freehand", name: "Freehand", icon: <PencilIcon className="h-4 w-4" />, count: 0, category: "draw" },
      { id: "line", name: "Line", icon: <Minus className="h-4 w-4" />, count: 0, category: "draw" },
      { id: "rectangle", name: "Rectangle", icon: <Square className="h-4 w-4" />, count: 0, category: "draw" },
      { id: "circle", name: "Circle", icon: <CircleIcon className="h-4 w-4" />, count: 0, category: "draw" },
    ]
  },
  {
    id: "real-items",
    name: "Real Items",
    icon: <Image className="h-4 w-4" />,
    symbols: [
      { id: "downlight-real", name: "Downlight", icon: <SymbolIcon type="downlight-real" />, count: 0, category: "real-items" },
      { id: "heat-pump", name: "Heat Pump", icon: <SymbolIcon type="heat-pump" />, count: 0, category: "real-items" },
    ]
  },
];
