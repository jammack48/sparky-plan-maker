import { Lightbulb, Zap, ToggleLeft, ToggleRight, Layers, Fan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
}

export const SymbolToolbar = ({ symbols, onSymbolSelect, selectedSymbol }: SymbolToolbarProps) => {
  return (
    <Card className="p-2 sm:p-3 space-y-2">
      <h3 className="font-semibold mb-2 text-xs sm:text-sm text-foreground">Symbols</h3>
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
    </Card>
  );
};

export const DEFAULT_SYMBOLS: SymbolType[] = [
  { id: "downlight", name: "Downlight", icon: <Lightbulb className="w-4 h-4" />, count: 0 },
  { id: "power-point", name: "Power Point", icon: <Zap className="w-4 h-4" />, count: 0 },
  { id: "single-switch", name: "Single", icon: <ToggleLeft className="w-4 h-4" />, count: 0 },
  { id: "double-switch", name: "Double", icon: <ToggleRight className="w-4 h-4" />, count: 0 },
  { id: "triple-switch", name: "Triple", icon: <Layers className="w-4 h-4" />, count: 0 },
  { id: "fan", name: "Fan", icon: <Fan className="w-4 h-4" />, count: 0 },
];
