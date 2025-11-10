import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Palette, Minus, Eye, Maximize, Zap, Droplet, Wind, Type, Pencil as PencilIcon, Square, Circle as CircleIcon, Shapes } from "lucide-react";
import { SymbolIcon } from "./SymbolIcon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SymbolCategory } from "./SymbolToolbar";

interface MobileSymbolMenuProps {
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
}

export const MobileSymbolMenu = ({
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
}: MobileSymbolMenuProps) => {
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedSymbolName = categories
    .flatMap(cat => cat.symbols)
    .find(sym => sym.id === selectedSymbol)?.name || "None";

  return (
    <div className="flex gap-2">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Shapes className="w-4 h-4 mr-2" />
            {selectedSymbol ? selectedSymbolName : "Symbols"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px] max-h-[60vh] overflow-y-auto z-50">
          <div className="p-2">
            <Accordion type="single" collapsible className="w-full">
              {categories.map((category) => (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="text-sm py-2">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span>{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      {category.symbols.map((symbol) => (
                        <Button
                          key={symbol.id}
                          variant={selectedSymbol === symbol.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            onSymbolSelect(symbol.id);
                            setMenuOpen(false);
                          }}
                          className="h-auto py-2 flex flex-col items-center gap-1"
                        >
                          <SymbolIcon type={symbol.id} size={20} />
                          <span className="text-xs">{symbol.name}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Style Controls */}
            <Collapsible open={isStyleOpen} onOpenChange={setIsStyleOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Style Controls
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isStyleOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3">
                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    Color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={symbolColor}
                      onChange={(e) => onColorChange(e.target.value)}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={symbolColor}
                      onChange={(e) => onColorChange(e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                  {colorHistory.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {colorHistory.slice(-5).map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => onColorChange(color)}
                          className="w-6 h-6 rounded border-2 border-border hover:border-primary transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thickness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Minus className="w-3 h-3" />
                      Thickness
                    </Label>
                    <span className="text-xs text-muted-foreground">{symbolThickness}px</span>
                  </div>
                  <Slider
                    value={[symbolThickness]}
                    onValueChange={([value]) => onThicknessChange(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Transparency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Opacity
                    </Label>
                    <span className="text-xs text-muted-foreground">{Math.round(symbolTransparency * 100)}%</span>
                  </div>
                  <Slider
                    value={[symbolTransparency]}
                    onValueChange={([value]) => onTransparencyChange(value)}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Scale */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Maximize className="w-3 h-3" />
                      Scale
                    </Label>
                    <span className="text-xs text-muted-foreground">{symbolScale.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[symbolScale]}
                    onValueChange={([value]) => onScaleChange(value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
