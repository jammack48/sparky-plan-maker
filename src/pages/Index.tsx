import { useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { FileUpload } from "@/components/FileUpload";
import { PageSelector } from "@/components/PageSelector";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { SymbolToolbar, DEFAULT_SYMBOLS } from "@/components/SymbolToolbar";
import { SymbolStyleControls } from "@/components/SymbolStyleControls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Set worker for PDF.js (Vite)
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
GlobalWorkerOptions.workerPort = new pdfjsWorker();

const Index = () => {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symbolColor, setSymbolColor] = useState("#000000");
  const [symbolThickness, setSymbolThickness] = useState(2);
  const [symbolTransparency, setSymbolTransparency] = useState(1);
  const [symbolScale, setSymbolScale] = useState(1);

  useEffect(() => {
    // Auto-generate a simple sample plan: white background with a black square
    const size = 1600;
    const squareSize = 800;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      const offset = (size - squareSize) / 2;
      ctx.strokeRect(offset, offset, squareSize, squareSize);
    }
    const dataUrl = c.toDataURL('image/png');
    setPdfPages([dataUrl]);
    setSelectedPages([0]);
    setCurrentPageIndex(0);
    toast.success('Loaded sample plan');
  }, []);

  const handleFileLoad = async (file: File) => {
    setIsLoading(true);
    try {
      // Handle image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setPdfPages([dataUrl]);
          setIsLoading(false);
          toast.success("Image loaded successfully");
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle PDF files
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const pagePromises = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          pagePromises.push(
            pdf.getPage(i).then(async (page) => {
              const viewport = page.getViewport({ scale: 1 });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({
                canvasContext: context!,
                viewport: viewport,
                canvas: canvas,
              }).promise;

              return canvas.toDataURL();
            })
          );
        }

        const pages = await Promise.all(pagePromises);
        setPdfPages(pages);
        setIsLoading(false);
        toast.success(`Loaded ${pages.length} page${pages.length > 1 ? "s" : ""}`);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to load file");
      console.error(error);
    }
  };

  const handlePageSelection = (selected: number[]) => {
    setSelectedPages(selected);
    setCurrentPageIndex(0);
  };

  const handleSymbolPlaced = (symbolId: string) => {
    setSymbols((prev) =>
      prev.map((s) => (s.id === symbolId ? { ...s, count: s.count + 1 } : s))
    );
    // Keep symbol selected for multiple placements
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  const handleExtractCrop = (dataUrl: string) => {
    setPdfPages((prevPages) => {
      const newIndex = prevPages.length;
      const updatedPages = [...prevPages, dataUrl];
      // Include new page in the current selection and jump to it
      setSelectedPages((prevSel) => {
        const updatedSelected = [...prevSel, newIndex];
        setCurrentPageIndex(updatedSelected.length - 1);
        return updatedSelected;
      });
      return updatedPages;
    });
    toast.success("Opened cropped area as a new sheet");
  };

  if (pdfPages.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-foreground">SparkyMate</h1>
            <p className="text-muted-foreground">Floor Plan Markup Tool for Electricians</p>
          </div>
          <FileUpload onFileLoad={handleFileLoad} isLoading={isLoading} />
          <div className="mt-4 flex items-center justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setPdfPages(["/images/sample-floorplan.png"]);
                setSelectedPages([0]);
                setCurrentPageIndex(0);
                toast.success("Loaded sample plan");
              }}
            >
              Load sample plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPages.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-foreground">SparkyMate</h1>
            <p className="text-muted-foreground">Floor Plan Markup Tool for Electricians</p>
          </div>
          <PageSelector pages={pdfPages} onSelect={handlePageSelection} />
        </div>
      </div>
    );
  }

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < selectedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border bg-card px-2 sm:px-4 py-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-xl font-bold text-foreground whitespace-nowrap">SparkyMate</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPageIndex === 0}
              className="text-xs px-2 py-1 h-7"
            >
              ← Prev
            </Button>
            <span className="text-xs text-muted-foreground px-1 whitespace-nowrap">
              {currentPageIndex + 1}/{selectedPages.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPageIndex === selectedPages.length - 1}
              className="text-xs px-2 py-1 h-7"
            >
              Next →
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col-reverse md:flex-row flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <CanvasWorkspace
            imageUrl={pdfPages[selectedPages[currentPageIndex]]}
            pageNumber={selectedPages[currentPageIndex] + 1}
            onExport={handleExport}
            onExtract={handleExtractCrop}
            selectedSymbol={selectedSymbol}
            onSymbolPlaced={handleSymbolPlaced}
            onSymbolDeselect={() => setSelectedSymbol(null)}
            symbolColor={symbolColor}
            symbolThickness={symbolThickness}
            symbolTransparency={symbolTransparency}
            symbolScale={symbolScale}
          />
        </main>

        <aside className="w-full md:w-48 lg:w-56 border-t md:border-t-0 md:border-l border-border bg-card shrink-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-2 sm:p-3 space-y-3">
            <SymbolToolbar
              symbols={symbols}
              onSymbolSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
              symbolColor={symbolColor}
              symbolThickness={symbolThickness}
              symbolTransparency={symbolTransparency}
              symbolScale={symbolScale}
              onColorChange={setSymbolColor}
              onThicknessChange={setSymbolThickness}
              onTransparencyChange={setSymbolTransparency}
              onScaleChange={setSymbolScale}
            />
            <div className="portrait:hidden landscape:block md:block">
              <SymbolStyleControls
                color={symbolColor}
                thickness={symbolThickness}
                transparency={symbolTransparency}
                scale={symbolScale}
                onColorChange={setSymbolColor}
                onThicknessChange={setSymbolThickness}
                onTransparencyChange={setSymbolTransparency}
                onScaleChange={setSymbolScale}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
