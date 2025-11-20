import { useEffect, useState, useRef } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import tradeSketchLogo from "@/assets/tradesketch-logo.png";
import { Home, RotateCcw, Save, FolderOpen } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { PageSelector } from "@/components/PageSelector";
import { HomeScreen } from "@/components/HomeScreen";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { SymbolToolbar, DEFAULT_SYMBOL_CATEGORIES, SymbolCategory } from "@/components/SymbolToolbar";
import { SymbolStyleControls } from "@/components/SymbolStyleControls";
import { Button } from "@/components/ui/button";
import { PageSetupDialog } from "@/components/PageSetupDialog";
import { PageSetup, DEFAULT_PAGE_SETUP } from "@/types/pageSetup";
import { toast } from "sonner";
import { saveProject, loadProject, listProjects, deleteProject, ProjectMetadata } from "@/lib/supabaseService";
import type { Canvas as FabricCanvas } from "fabric";

// Set worker for PDF.js (Vite)
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
GlobalWorkerOptions.workerPort = new pdfjsWorker();

const Index = () => {
  // App screen navigation state
  type AppScreen = 'home' | 'template' | 'pageSelection' | 'canvas';
  const [appScreen, setAppScreen] = useState<AppScreen>('home');
  
  // Project name state with localStorage persistence
  const [projectName, setProjectName] = useState<string>(() => {
    const saved = localStorage.getItem('tradesketch-project-name');
    return saved || 'Untitled Project';
  });

  // Project state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<ProjectMetadata[]>([]);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [pendingCanvasData, setPendingCanvasData] = useState<any>(null);

  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [symbolCategories, setSymbolCategories] = useState<SymbolCategory[]>(DEFAULT_SYMBOL_CATEGORIES);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasScale, setCanvasScale] = useState<number | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  
  // Per-symbol settings storage
  const [symbolSettings, setSymbolSettings] = useState<Record<string, {
    color: string;
    thickness: number;
    transparency: number;
    scale: number;
    colorHistory: string[];
  }>>({});

  // Current display values
  const [symbolColor, setSymbolColor] = useState("#000000");
  const [symbolThickness, setSymbolThickness] = useState(2);
  const [symbolTransparency, setSymbolTransparency] = useState(1);
  const [symbolScale, setSymbolScale] = useState(1);

  // Page setup state
  const [pageSetup, setPageSetup] = useState<PageSetup>(() => {
    const saved = localStorage.getItem('tradesketch-page-setup');
    return saved ? JSON.parse(saved) : DEFAULT_PAGE_SETUP;
  });
  const [showPageSetupDialog, setShowPageSetupDialog] = useState(false);
  
  // Title block visibility state
  const [showTitleBlock, setShowTitleBlock] = useState<boolean>(() => {
    const saved = localStorage.getItem('tradesketch-show-title-block');
    return saved ? JSON.parse(saved) : true;
  });

  // Save page setup to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tradesketch-page-setup', JSON.stringify(pageSetup));
  }, [pageSetup]);

  // Save title block visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tradesketch-show-title-block', JSON.stringify(showTitleBlock));
  }, [showTitleBlock]);

  // Save project name to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tradesketch-project-name', projectName);
  }, [projectName]);

  // Load saved projects on mount
  useEffect(() => {
    loadSavedProjects();
  }, []);

  const loadSavedProjects = async () => {
    const { data, error } = await listProjects();
    if (error) {
      console.error("Error loading projects:", error);
      return;
    }
    if (data) {
      setSavedProjects(data);
    }
  };

  const handleSaveProject = async () => {
    if (!canvasRef.current) {
      toast.error("No canvas to save");
      return;
    }

    try {
      // Get canvas JSON
      const canvasJson = canvasRef.current.toJSON();

      const { data, error } = await saveProject(
        {
          name: projectName,
          canvas_json: canvasJson,
          current_page_index: currentPageIndex,
          scale: canvasScale,
          grid_size: null,
          grid_color: null,
          grid_thickness: null,
          grid_opacity: null,
          show_grid: false,
          page_setup: pageSetup,
          show_title_block: showTitleBlock,
          symbol_settings: symbolSettings,
          symbol_categories: null, // Don't save React elements
          background_image_url: pdfPages[selectedPages[currentPageIndex]],
          original_file_name: null,
          original_file_type: 'image',
        },
        currentProjectId || undefined
      );

      if (error) {
        toast.error("Failed to save project");
        console.error(error);
        return;
      }

      if (data) {
        const isUpdate = currentProjectId !== null;
        setCurrentProjectId(data.id);
        toast.success(isUpdate ? `Project "${projectName}" updated!` : `Project "${projectName}" saved!`);
        loadSavedProjects();
      }
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    const { data, error } = await loadProject(projectId);
    
    if (error || !data) {
      toast.error("Failed to load project");
      console.error(error);
      return;
    }

    try {
      // Restore project state
      setProjectName(data.name);
      setCurrentProjectId(data.id);
      
      if (data.page_setup) {
        setPageSetup(data.page_setup);
      }
      setShowTitleBlock(data.show_title_block);
      
      if (data.symbol_settings) {
        setSymbolSettings(data.symbol_settings);
      }
      // Don't load symbol_categories - use default categories and update counts from symbol_settings
      
      // Prepare background / pages
      if (data.canvas_json) {
        // When we have a full saved canvas, don't reload the background image separately
        // Just provide an empty page so imageUrl is blank and the restored JSON is the source of truth
        setPdfPages([""]);
        setSelectedPages([0]);
        setCurrentPageIndex(data.current_page_index ?? 0);
        setPendingCanvasData(data.canvas_json);
      } else if (data.background_image_url) {
        // Legacy / fallback case: no canvas JSON yet, use the raw background image
        setPdfPages([data.background_image_url]);
        setSelectedPages([0]);
        setCurrentPageIndex(0);
      }
      
      // Navigate to canvas
      setAppScreen('canvas');
      
      toast.success(`Loaded project "${data.name}"`);
    } catch (error) {
      toast.error("Failed to restore project");
      console.error(error);
    }
  };
  const handleUseTemplate = () => {
    // Reset symbol counts when starting a new template
    setSymbolCategories((prev) => prev.map(cat => ({
      ...cat,
      symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
    })));

    // Turn off title block by default
    setShowTitleBlock(false);

    // Generate a simple sample plan: white background with a black square
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
    setAppScreen('canvas');
    toast.success('Loaded Template 1');
  };

  const handleUseTemplate2 = () => {
    // Reset symbol counts when starting a new template
    setSymbolCategories((prev) => prev.map(cat => ({
      ...cat,
      symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
    })));

    // Turn off title block by default
    setShowTitleBlock(false);

    // Load the residential floor plan template
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      const dataUrl = c.toDataURL('image/png');
      setPdfPages([dataUrl]);
      setSelectedPages([0]);
      setCurrentPageIndex(0);
      setAppScreen('canvas');
      toast.success('Loaded Template 2 - Residential Floor Plan');
    };
    img.onerror = () => {
      toast.error('Failed to load template image');
      console.error('Template image failed to load from /images/template-floorplan.png');
    };
    img.src = '/images/template-floorplan.png';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileLoad(file);
    }
  };

  const handleFileLoad = async (file: File) => {
    setIsLoading(true);
    try {
      // Reset counts when loading a new file
      setSymbolCategories((prev) => prev.map(cat => ({
        ...cat,
        symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
      })));

      // Turn off title block by default when loading files
      setShowTitleBlock(false);

      // Handle image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setPdfPages([dataUrl]);
          setSelectedPages([0]);
          setCurrentPageIndex(0);
          setAppScreen('canvas');
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
        setAppScreen('pageSelection');
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
    setAppScreen('canvas');
    toast.success(`Selected ${selected.length} page${selected.length !== 1 ? 's' : ''}`);
  };

  const handleSymbolPlaced = (symbolId: string) => {
    setSymbolCategories((prev) =>
      prev.map((category) => ({
        ...category,
        symbols: category.symbols.map((s) =>
          s.id === symbolId ? { ...s, count: s.count + 1 } : s
        ),
      }))
    );
    // Keep symbol selected for multiple placements
  };

  const handleExport = (canvasDataUrl: string, imgWidth: number, imgHeight: number) => {
    // This will be called from CanvasWorkspace with the high-res canvas data
    import('@/lib/pdfExport').then(({ generatePDF }) => {
      generatePDF(canvasDataUrl, pageSetup, imgWidth, imgHeight);
    });
  };

  const handlePageSetupSave = (setup: PageSetup) => {
    setPageSetup(setup);
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

  // Save settings for current symbol when they change
  const saveSymbolSettings = (symbolId: string, color: string, thickness: number, transparency: number, scale: number) => {
    setSymbolSettings((prev) => {
      const current = prev[symbolId] || { color: "#000000", thickness: 2, transparency: 1, scale: 1, colorHistory: [] };
      const history = [...current.colorHistory];
      
      // Add color to history if it's new and different from the last one
      if (color !== history[0] && !history.includes(color)) {
        history.unshift(color);
        // Keep only 5 most recent colors
        if (history.length > 5) {
          history.pop();
        }
      }
      
      return {
        ...prev,
        [symbolId]: { color, thickness, transparency, scale, colorHistory: history }
      };
    });
  };

  // Load settings when symbol is selected
  const handleSymbolSelect = (symbolId: string | null) => {
    if (symbolId) {
      const saved = symbolSettings[symbolId];
      if (saved) {
        setSymbolColor(saved.color);
        setSymbolThickness(saved.thickness);
        setSymbolTransparency(saved.transparency);
        setSymbolScale(saved.scale);
      }
    }
    setSelectedSymbol(symbolId);
  };

  // Update color and save to current symbol
  const handleColorChange = (color: string) => {
    setSymbolColor(color);
    if (selectedSymbol) {
      saveSymbolSettings(selectedSymbol, color, symbolThickness, symbolTransparency, symbolScale);
    }
  };

  // Update thickness and save
  const handleThicknessChange = (thickness: number) => {
    setSymbolThickness(thickness);
    if (selectedSymbol) {
      saveSymbolSettings(selectedSymbol, symbolColor, thickness, symbolTransparency, symbolScale);
    }
  };

  // Update transparency and save
  const handleTransparencyChange = (transparency: number) => {
    setSymbolTransparency(transparency);
    if (selectedSymbol) {
      saveSymbolSettings(selectedSymbol, symbolColor, symbolThickness, transparency, symbolScale);
    }
  };

  // Update scale and save
  const handleScaleChange = (scale: number) => {
    setSymbolScale(scale);
    if (selectedSymbol) {
      saveSymbolSettings(selectedSymbol, symbolColor, symbolThickness, symbolTransparency, scale);
    }
  };

  // Home screen
  if (appScreen === 'home') {
    return (
      <HomeScreen 
        onNewProject={(name) => {
          setProjectName(name);
          setCurrentProjectId(null);
          setAppScreen('template');
        }}
        onSkip={() => {
          setProjectName('Untitled Project');
          setCurrentProjectId(null);
          setAppScreen('template');
        }}
        savedProjects={savedProjects}
        onLoadProject={handleLoadProject}
        onDeleteProject={async (projectId) => {
          const { error } = await deleteProject(projectId);
          if (error) {
            toast.error("Failed to delete project");
          } else {
            toast.success("Project deleted");
            loadSavedProjects();
          }
        }}
      />
    );
  }

  // Template selection screen
  if (appScreen === 'template' && pdfPages.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src={tradeSketchLogo} alt="TradeSketch Pro" className="w-16 h-16" />
              <h1 className="text-4xl font-bold text-foreground">TradeSketch Pro</h1>
            </div>
            <p className="text-muted-foreground">Professional floor plan and technical drawing tool</p>
          </div>
          <FileUpload onFileLoad={handleFileLoad} isLoading={isLoading} />
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={handleUseTemplate}
              className="active:scale-95 active:bg-primary active:text-primary-foreground transition-transform"
            >
              Template 1 (Blank)
            </Button>
            <Button
              variant="secondary"
              onClick={handleUseTemplate2}
              className="active:scale-95 active:bg-primary active:text-primary-foreground transition-transform"
            >
              Template 2 (Floor Plan)
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer active:scale-95 transition-transform inline-flex items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                Take a Photo
              </label>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Page selection screen
  if (appScreen === 'pageSelection' || (pdfPages.length > 0 && selectedPages.length === 0)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src={tradeSketchLogo} alt="TradeSketch Pro" className="w-16 h-16" />
              <h1 className="text-4xl font-bold text-foreground">TradeSketch Pro</h1>
            </div>
            <p className="text-muted-foreground">Professional floor plan and technical drawing tool</p>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-2">
            <div className="flex items-center gap-2">
              <img src={tradeSketchLogo} alt="TradeSketch Pro" className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-base sm:text-xl font-bold text-foreground">
                TradeSketch Pro
              </h1>
            </div>
            {projectName && projectName !== 'Untitled Project' && (
              <span className="text-xs sm:text-base text-muted-foreground ml-8 sm:ml-0">
                • {projectName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
              className="text-xs px-2 py-1 h-7"
              title="Save Project"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Go back to home? You'll lose any unsaved work.")) {
                  setAppScreen('home');
                  setSelectedPages([]);
                  setPdfPages([]);
                  setCurrentPageIndex(0);
                  setSymbolCategories(DEFAULT_SYMBOL_CATEGORIES);
                  setCurrentProjectId(null);
                }
              }}
              className="text-xs px-2 py-1 h-7"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset current page? You'll lose all changes.")) {
                  // Reset all symbol counts
                  setSymbolCategories((prev) => prev.map(cat => ({
                    ...cat,
                    symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
                  })));

                  // Force canvas workspace to reload by toggling the page
                  const current = currentPageIndex;
                  setCurrentPageIndex(-1);
                  setTimeout(() => setCurrentPageIndex(current), 10);
                }
              }}
              className="text-xs px-2 py-1 h-7"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
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
            onPageSetup={() => setShowPageSetupDialog(true)}
            pageSetup={pageSetup}
            showTitleBlock={showTitleBlock}
            onToggleTitleBlock={setShowTitleBlock}
            selectedSymbol={selectedSymbol}
            onSymbolPlaced={handleSymbolPlaced}
            onSymbolDeselect={() => setSelectedSymbol(null)}
            onSymbolSelect={handleSymbolSelect}
            symbolColor={symbolColor}
            symbolThickness={symbolThickness}
            symbolTransparency={symbolTransparency}
            symbolScale={symbolScale}
            symbolCategories={symbolCategories}
            onScaleChange={setCanvasScale}
            onZoomChange={setCanvasZoom}
            onCanvasReady={(canvas, setIsRestoring) => { 
              canvasRef.current = canvas;
              
              // Restore pending canvas data if any
              if (pendingCanvasData) {
                try {
                  setIsRestoring(true);
                  canvas.loadFromJSON(pendingCanvasData, () => {
                    canvas.renderAll();
                    setIsRestoring(false);
                    toast.success("Canvas restored");
                  });
                  setPendingCanvasData(null);
                } catch (error) {
                  console.error("Error restoring canvas:", error);
                  toast.error("Failed to restore canvas content");
                  setIsRestoring(false);
                }
              }
            }}
          />
        </main>

        <aside className="hidden lg:block w-48 lg:w-56 border-l border-border bg-card shrink-0 overflow-hidden relative z-10 pointer-events-auto">
          <div className="h-full overflow-y-auto p-2 sm:p-3 space-y-3" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <SymbolToolbar
              categories={symbolCategories}
              onSymbolSelect={handleSymbolSelect}
              selectedSymbol={selectedSymbol}
              symbolColor={symbolColor}
              symbolThickness={symbolThickness}
              symbolTransparency={symbolTransparency}
              symbolScale={symbolScale}
              onColorChange={handleColorChange}
              onThicknessChange={handleThicknessChange}
              onTransparencyChange={handleTransparencyChange}
              onScaleChange={handleScaleChange}
              colorHistory={selectedSymbol ? (symbolSettings[selectedSymbol]?.colorHistory || []) : []}
              onCategoriesChange={setSymbolCategories}
              scale={canvasScale}
              zoomLevel={canvasZoom}
            />
            <div className="portrait:hidden landscape:block md:block">
              <SymbolStyleControls
                color={symbolColor}
                thickness={symbolThickness}
                transparency={symbolTransparency}
                scale={symbolScale}
                onColorChange={handleColorChange}
                onThicknessChange={handleThicknessChange}
                onTransparencyChange={handleTransparencyChange}
                onScaleChange={handleScaleChange}
                colorHistory={selectedSymbol ? (symbolSettings[selectedSymbol]?.colorHistory || []) : []}
              />
            </div>
          </div>
        </aside>
      </div>

      <PageSetupDialog
        open={showPageSetupDialog}
        onOpenChange={setShowPageSetupDialog}
        pageSetup={pageSetup}
        onSave={handlePageSetupSave}
      />
    </div>
  );
};

export default Index;
