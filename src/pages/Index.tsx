import { useState } from "react";
import { getDocument } from "pdfjs-dist";
import { PdfUpload } from "@/components/PdfUpload";
import { PageSelector } from "@/components/PageSelector";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { SymbolToolbar, DEFAULT_SYMBOLS } from "@/components/SymbolToolbar";
import { toast } from "sonner";

// Set worker path for PDF.js
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const Index = () => {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handlePdfLoad = async (file: File) => {
    try {
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
      toast.success(`Loaded ${pages.length} page${pages.length > 1 ? "s" : ""}`);
    } catch (error) {
      toast.error("Failed to load PDF");
      console.error(error);
    }
  };

  const handlePageSelection = (selected: number[]) => {
    setSelectedPages(selected);
    setCurrentPageIndex(0);
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  if (pdfPages.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-foreground">SparkyMate</h1>
            <p className="text-muted-foreground">Floor Plan Markup Tool for Electricians</p>
          </div>
          <PdfUpload onPdfLoad={handlePdfLoad} />
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SparkyMate</h1>
            <p className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {selectedPages.length}
            </p>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <main className="flex-1 p-6">
          <CanvasWorkspace
            imageUrl={pdfPages[selectedPages[currentPageIndex]]}
            pageNumber={selectedPages[currentPageIndex] + 1}
            onExport={handleExport}
          />
        </main>

        <aside className="w-64 border-l border-border bg-card p-4">
          <SymbolToolbar
            symbols={symbols}
            onSymbolSelect={setSelectedSymbol}
            selectedSymbol={selectedSymbol}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
