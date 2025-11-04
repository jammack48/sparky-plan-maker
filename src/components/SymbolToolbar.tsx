import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Palette, Minus, Eye, Maximize } from "lucide-react";
import { SymbolIcon } from "./SymbolIcon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface SymbolType {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface SymbolToolbarProps {
  symbols: SymbolType[];
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
}

export const SymbolToolbar = ({ 
  symbols, 
  onSymbolSelect, 
  selectedSymbol,
  symbolColor,
  symbolThickness,
  symbolTransparency,
  symbolScale,
  onColorChange,
  onThicknessChange,
  onTransparencyChange,
  onScaleChange
}: SymbolToolbarProps) => {
  const [isStyleOpen, setIsStyleOpen] = useState(false);

  return (
    <Card className="p-2 sm:p-3 space-y-2">
      <Collapsible open={isStyleOpen} onOpenChange={setIsStyleOpen}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Symbols</h3>
          <CollapsibleTrigger asChild className="portrait:flex landscape:hidden md:hidden">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <div className="flex flex-row md:flex-col gap-1 sm:gap-2 flex-wrap md:flex-nowrap">
          {symbols.map((symbol) => (
            <Button
              key={symbol.id}
              variant={selectedSymbol === symbol.id ? "default" : "outline"}
              className="flex-1 md:w-full justify-between min-w-[80px] text-xs sm:text-sm"
              size="sm"
              onClick={() => onSymbolSelect(symbol.id)}
            >
              <span className="flex items-center gap-1 sm:gap-2">
                {symbol.icon}
                <span className="hidden sm:inline">{symbol.name}</span>
              </span>
              <span className="text-xs">{symbol.count}</span>
            </Button>
          ))}
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

export const DEFAULT_SYMBOLS: SymbolType[] = [
  { id: "downlight", name: "Downlight", icon: <SymbolIcon type="downlight" />, count: 0 },
  { id: "power-point", name: "Power Point", icon: <SymbolIcon type="power-point" />, count: 0 },
  { id: "single-switch", name: "Single Switch", icon: <SymbolIcon type="single-switch" />, count: 0 },
  { id: "double-switch", name: "Double Switch", icon: <SymbolIcon type="double-switch" />, count: 0 },
  { id: "triple-switch", name: "Triple Switch", icon: <SymbolIcon type="triple-switch" />, count: 0 },
  { id: "fan", name: "Fan", icon: <SymbolIcon type="fan" />, count: 0 },
];
