import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Palette, Minus, Eye, Maximize, Zap, Droplet, Wind, Type, Pencil } from "lucide-react";
import { SymbolIcon } from "./SymbolIcon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface SymbolType {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  category: "electrical" | "plumbing" | "hvac" | "text" | "draw";
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
  colorHistory
}: SymbolToolbarProps) => {
  const [isStyleOpen, setIsStyleOpen] = useState(false);

  return (
    <Card className="p-2 sm:p-3 space-y-2 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-xs sm:text-sm text-foreground">Symbols</h3>
      </div>
      
      <Accordion 
        type="single" 
        collapsible 
        className="w-full"
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
                  <Button
                    key={symbol.id}
                    variant={selectedSymbol === symbol.id ? "default" : "outline"}
                    className="w-full justify-between text-xs sm:text-sm"
                    size="sm"
                    onClick={() => onSymbolSelect(symbol.id)}
                  >
                    <span className="flex items-center gap-1 sm:gap-2">
                      {symbol.icon}
                      <span>{symbol.name}</span>
                    </span>
                    <span className="text-xs">{symbol.count}</span>
                  </Button>
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
      { id: "ac-unit", name: "AC Unit", icon: <SymbolIcon type="downlight" />, count: 0, category: "hvac" },
      { id: "vent", name: "Vent", icon: <SymbolIcon type="power-point" />, count: 0, category: "hvac" },
      { id: "thermostat", name: "Thermostat", icon: <SymbolIcon type="single-switch" />, count: 0, category: "hvac" },
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
    icon: <Pencil className="h-4 w-4" />,
    symbols: [
      { id: "freehand", name: "Freehand", icon: <Pencil className="h-4 w-4" />, count: 0, category: "draw" },
    ]
  },
];
