import { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { FileUpload } from "@/components/FileUpload";
import { PageSelector } from "@/components/PageSelector";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { SymbolToolbar, DEFAULT_SYMBOLS } from "@/components/SymbolToolbar";
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">SparkyMate</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPageIndex === 0}
              >
                ← Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPageIndex + 1} of {selectedPages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPageIndex === selectedPages.length - 1}
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <main className="flex-1 p-6">
          <CanvasWorkspace
            imageUrl={pdfPages[selectedPages[currentPageIndex]]}
            pageNumber={selectedPages[currentPageIndex] + 1}
            onExport={handleExport}
            onExtract={handleExtractCrop}
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
