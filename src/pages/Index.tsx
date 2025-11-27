import { useEffect, useState, useRef, useCallback } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import tradeSketchLogo from "@/assets/tradesketch-logo.png";
import { Home, RotateCcw, Save, FolderOpen, Menu, Plus, X } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { PageSelector } from "@/components/PageSelector";
import { HomeScreen } from "@/components/HomeScreen";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { SymbolToolbar, DEFAULT_SYMBOL_CATEGORIES, SymbolCategory } from "@/components/SymbolToolbar";
import { SymbolStyleControls } from "@/components/SymbolStyleControls";
import { DistanceStyleControls } from "@/components/DistanceStyleControls";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageSetupDialog } from "@/components/PageSetupDialog";
import { ProjectNameDialog } from "@/components/ProjectNameDialog";
import { ExportPdfDialog } from "@/components/ExportPdfDialog";
import { PageSetup, DEFAULT_PAGE_SETUP } from "@/types/pageSetup";
import { toast } from "sonner";
import { saveProject, loadProject, listProjects, deleteProject, renameProject, ProjectMetadata } from "@/lib/supabaseService";
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
  const hasRestoredRef = useRef(false);

  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Dialog state for adding more images
  const [showAddMoreDialog, setShowAddMoreDialog] = useState(false);
  const [isAddingToProject, setIsAddingToProject] = useState(false);
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
  const [shapeFilled, setShapeFilled] = useState(false);
  const [fillColor, setFillColor] = useState("#ff0000");

  // Distance measurement style state
  const [canvasMode, setCanvasMode] = useState<string>("select");
  const [distanceColor, setDistanceColor] = useState("#ef4444");
  const [distanceStrokeWidth, setDistanceStrokeWidth] = useState(2);
  const [distanceFontSize, setDistanceFontSize] = useState(16);

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
  
  // Project naming dialog state
  const [isProjectNameDialogOpen, setIsProjectNameDialogOpen] = useState(false);
  
  // Confirmation dialog states
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

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

    // Check if project needs a name
    if (projectName === 'Untitled Project' || !projectName.trim()) {
      setIsProjectNameDialogOpen(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    if (!canvasRef.current) return;

    try {
      // Get canvas JSON
      const canvasJson = JSON.parse(JSON.stringify(canvasRef.current.toObject(['isBackgroundImage', 'backgroundLocked'])));

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

  const handleProjectNameSave = (name: string) => {
    setProjectName(name);
    localStorage.setItem('tradesketch-project-name', name);
    // Save will happen after state update
    setTimeout(() => performSave(), 100);
  };

  const handleLoadProject = async (projectId: string) => {
    const { data, error } = await loadProject(projectId);
    
    if (error || !data) {
      toast.error("Failed to load project");
      console.error(error);
      return;
    }

    try {
      // Reset restoration flag for new load
      hasRestoredRef.current = false;
      
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
      
      // Don't load background image from background_image_url when restoring
      // The canvas_json already contains the complete canvas state including background
      
      // Store canvas data to restore after canvas is ready
      if (data.canvas_json) {
        setPendingCanvasData(data.canvas_json);
      }
      
      // Set up a placeholder page so CanvasWorkspace can mount
      // The actual canvas content will be restored from canvas_json
      setPdfPages(['']); // Empty string as placeholder - canvas will restore from JSON
      setSelectedPages([0]);
      setCurrentPageIndex(0);
      
      // Navigate to canvas
      setAppScreen('canvas');
      
      // Toast will be shown after canvas restoration completes
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
      // Check if we're adding to an existing project (Plus button was clicked)
      const addingToExisting = isAddingToProject && pdfPages.length > 0;

      if (!addingToExisting) {
        // Reset counts when starting a new project
        setSymbolCategories((prev) => prev.map(cat => ({
          ...cat,
          symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
        })));
        // Turn off title block by default when loading files
        setShowTitleBlock(false);
      }

      // Handle image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          if (addingToExisting) {
            // Add to existing pages
            setPdfPages((prev) => [...prev, dataUrl]);
            const newPageIndex = pdfPages.length;
            setSelectedPages((prev) => [...prev, newPageIndex]);
            setCurrentPageIndex(selectedPages.length);
            setIsLoading(false);
            setShowAddMoreDialog(true);
            toast.success("Image added successfully");
          } else {
            // Start new project
            setPdfPages([dataUrl]);
            setSelectedPages([0]);
            setCurrentPageIndex(0);
            setAppScreen('canvas');
            setIsLoading(false);
            toast.success("Image loaded successfully");
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle PDF files
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ 
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/standard_fonts/',
        }).promise;
        const pagePromises = [];
        let failedPages = 0;

        for (let i = 1; i <= pdf.numPages; i++) {
          pagePromises.push(
            pdf.getPage(i).then(async (page) => {
              try {
                const viewport = page.getViewport({ scale: 3 });
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
              } catch (error) {
                console.warn(`Failed to render page ${i}:`, error);
                failedPages++;
                
                // Create a placeholder canvas for failed pages
                const canvas = document.createElement("canvas");
                canvas.width = 800;
                canvas.height = 1100;
                const context = canvas.getContext("2d");
                if (context) {
                  context.fillStyle = "#f3f4f6";
                  context.fillRect(0, 0, canvas.width, canvas.height);
                  context.fillStyle = "#374151";
                  context.font = "24px sans-serif";
                  context.textAlign = "center";
                  context.fillText(`Page ${i}`, canvas.width / 2, canvas.height / 2 - 20);
                  context.font = "16px sans-serif";
                  context.fillText("Failed to render", canvas.width / 2, canvas.height / 2 + 20);
                }
                return canvas.toDataURL();
              }
            })
          );
        }

        const pages = await Promise.all(pagePromises);
        
        if (addingToExisting) {
          // Add PDF pages to existing project
          setPdfPages((prev) => [...prev, ...pages]);
          const startIndex = pdfPages.length;
          const newIndices = pages.map((_, i) => startIndex + i);
          setSelectedPages((prev) => [...prev, ...newIndices]);
          setCurrentPageIndex(selectedPages.length);
          setIsLoading(false);
          setShowAddMoreDialog(true);
          
          if (failedPages > 0) {
            toast.warning(`Added ${pages.length} pages (${failedPages} partially rendered)`);
          } else {
            toast.success(`Added ${pages.length} page${pages.length > 1 ? "s" : ""}`);
          }
        } else {
          // Start new project with PDF pages
          setPdfPages(pages);
          setAppScreen('pageSelection');
          setIsLoading(false);
          
          if (failedPages > 0) {
            toast.warning(`Loaded ${pages.length} pages (${failedPages} page${failedPages > 1 ? 's' : ''} partially rendered)`);
          } else {
            toast.success(`Loaded ${pages.length} page${pages.length > 1 ? "s" : ""}`);
          }
        }
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

  const handleSymbolPlaced = useCallback((symbolId: string) => {
    setSymbolCategories((prev) =>
      prev.map((category) => ({
        ...category,
        symbols: category.symbols.map((s) =>
          s.id === symbolId ? { ...s, count: s.count + 1 } : s
        ),
      }))
    );
    // Keep symbol selected for multiple placements
  }, []);

  const handleSymbolDeleted = useCallback((symbolId: string) => {
    setSymbolCategories((prev) =>
      prev.map((category) => ({
        ...category,
        symbols: category.symbols.map((s) =>
          s.id === symbolId ? { ...s, count: Math.max(0, s.count - 1) } : s
        ),
      }))
    );
  }, []);

  const handleExport = useCallback((canvasDataUrl: string, imgWidth: number, imgHeight: number) => {
    // Store single page export data and open dialog
    const exportData = { canvasDataUrl, imgWidth, imgHeight };
    (window as any).__currentExportData = exportData;
    setShowExportDialog(true);
  }, []);

  const handleExportPages = useCallback(async (pageIndices: number[]) => {
    if (pageIndices.length === 0) return;

    toast.info(`Preparing ${pageIndices.length} page${pageIndices.length > 1 ? 's' : ''} for export...`);

    try {
      // Get all canvas data URLs for selected pages
      const canvasDataUrls: string[] = [];
      
      for (const pageIndex of pageIndices) {
        // If it's the current page, use the already rendered data
        if (pageIndex === selectedPages[currentPageIndex]) {
          const exportData = (window as any).__currentExportData;
          if (exportData) {
            canvasDataUrls.push(exportData.canvasDataUrl);
            continue;
          }
        }
        
        // For other pages, we need to render them
        // This is a simplified approach - in a full implementation you'd 
        // need to temporarily switch pages and render each one
        const pageImageUrl = pdfPages[pageIndex];
        if (pageImageUrl) {
          canvasDataUrls.push(pageImageUrl);
        }
      }

      // Import and call PDF generation
      const { generatePDF } = await import('@/lib/pdfExport');
      await generatePDF(canvasDataUrls, pageSetup, 0, 0);
      
      toast.success(`PDF exported with ${pageIndices.length} page${pageIndices.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  }, [selectedPages, currentPageIndex, pdfPages, pageSetup]);

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

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      const { error } = await renameProject(projectId, newName);
      if (error) {
        toast.error("Failed to rename project");
        return;
      }
      
      toast.success(`Renamed to "${newName}"`);
      
      // Refresh the project list
      await loadSavedProjects();
      
      // If renaming current project, update the name in state
      if (currentProjectId === projectId) {
        setProjectName(newName);
        localStorage.setItem('tradesketch-project-name', newName);
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      toast.error('Failed to rename project');
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
        onRenameProject={handleRenameProject}
      />
    );
  }

  // Template selection screen
  if (appScreen === 'template') {
    return (
      <>
        <div className="min-h-screen bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsAddingToProject(false);
                  setShowHomeConfirm(true);
                }}
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsAddingToProject(false);
                  setAppScreen('home');
                }}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8">
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
        </div>

        {/* Add More Images Dialog - shown on template screen */}
        <AlertDialog open={showAddMoreDialog} onOpenChange={setShowAddMoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Image Added Successfully</AlertDialogTitle>
              <AlertDialogDescription>
                Would you like to add another image/file or return to the canvas?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowAddMoreDialog(false);
                setIsAddingToProject(true);
              }}>
                Add Another Image
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowAddMoreDialog(false);
                setIsAddingToProject(false);
                setAppScreen('canvas');
              }}>
                Go to Canvas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
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
          <PageSelector 
            pages={pdfPages} 
            onSelect={handlePageSelection}
            onCancel={() => {
              setIsAddingToProject(false);
              setAppScreen('template');
            }}
            onHome={() => {
              setIsAddingToProject(false);
              setShowHomeConfirm(true);
            }}
          />
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <img src={tradeSketchLogo} alt="TradeSketch Pro" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-bold text-foreground whitespace-nowrap">
                TradeSketch Pro
              </h1>
            </div>
            {projectName && projectName !== 'Untitled Project' && (
              <span className="text-xs sm:text-base text-muted-foreground ml-8 sm:ml-0 truncate">
                • {projectName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                  title="Menu"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSaveProject}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setIsAddingToProject(true);
                  setAppScreen('template');
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowHomeConfirm(true)}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            key={`page-${selectedPages[currentPageIndex]}`}
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
            onModeChange={setCanvasMode}
            distanceColor={distanceColor}
            distanceStrokeWidth={distanceStrokeWidth}
            distanceFontSize={distanceFontSize}
            onDistanceColorChange={setDistanceColor}
            onDistanceStrokeWidthChange={setDistanceStrokeWidth}
            onDistanceFontSizeChange={setDistanceFontSize}
            shapeFilled={shapeFilled}
            fillColor={fillColor}
            onSymbolDeleted={handleSymbolDeleted}
            onCanvasReady={(canvas, setIsRestoring) => {
              canvasRef.current = canvas;
              
              // Early exit if no data or already restored
              if (!pendingCanvasData || hasRestoredRef.current) {
                return;
              }
              
              hasRestoredRef.current = true;
              const dataToRestore = pendingCanvasData;
              setPendingCanvasData(null);
              
              console.info('[Canvas Restore] Starting restoration...');
              
              try {
                setIsRestoring(true);
                canvas.loadFromJSON(dataToRestore, () => {
                  const objects = canvas.getObjects();
                  const bgImage = objects.find((obj: any) => obj.name === 'backgroundImage');
                  
                  console.info('[Canvas Restore] Found background?', { 
                    found: !!bgImage,
                    totalObjects: objects.length 
                  });
                  
                  if (bgImage) {
                    (bgImage as any).isBackgroundImage = true;
                    
                    // Restore backgroundLocked property, default to true if not set
                    if ((bgImage as any).backgroundLocked === undefined) {
                      (bgImage as any).backgroundLocked = true;
                      console.info('[Canvas Restore] No backgroundLocked in JSON, defaulted to true');
                    }
                    
                    const isLocked = (bgImage as any).backgroundLocked !== false;
                    
                    console.info('[Canvas Restore] Background lock state', {
                      backgroundLockedProperty: (bgImage as any).backgroundLocked,
                      isLocked,
                      beforeSelectable: bgImage.selectable,
                      beforeEvented: bgImage.evented
                    });
                    
                    // Apply the lock state from the object's own property
                    bgImage.set({
                      selectable: !isLocked,
                      evented: !isLocked,
                      hasControls: !isLocked,
                      lockMovementX: isLocked,
                      lockMovementY: isLocked,
                      lockRotation: isLocked,
                      lockScalingX: isLocked,
                      lockScalingY: isLocked,
                      hoverCursor: isLocked ? 'default' : 'move',
                      moveCursor: isLocked ? 'default' : 'move',
                    });
                    
                    console.info('[Canvas Restore] After applying lock', {
                      selectable: bgImage.selectable,
                      evented: bgImage.evented,
                      hasControls: bgImage.hasControls,
                      lockMovementX: bgImage.lockMovementX,
                      lockMovementY: bgImage.lockMovementY
                    });
                    
                    // Force update the object coords after setting lock properties
                    bgImage.setCoords();
                    
                    // Note: CanvasWorkspace will sync its lockBackground state from the object property
                    console.info('[Canvas Restore] Background lock configured and coords updated');
                  }
                  
                  canvas.renderAll();
                  setIsRestoring(false);
                  
                  toast.success(`Loaded project "${projectName}"`, { id: "project-loaded" });
                  console.info('[Canvas Restore] Complete');
                });
              } catch (error) {
                console.error("Error restoring canvas:", error);
                toast.error("Failed to restore canvas content");
                setIsRestoring(false);
                hasRestoredRef.current = false;
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
              {canvasMode === "measure-distance" ? (
                <DistanceStyleControls
                  color={distanceColor}
                  strokeWidth={distanceStrokeWidth}
                  fontSize={distanceFontSize}
                  onColorChange={setDistanceColor}
                  onStrokeWidthChange={setDistanceStrokeWidth}
                  onFontSizeChange={setDistanceFontSize}
                />
              ) : (
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
                  shapeFilled={shapeFilled}
                  onShapeFilledChange={setShapeFilled}
                  showShapeFillToggle={selectedSymbol === "rectangle" || selectedSymbol === "circle"}
                  fillColor={fillColor}
                  onFillColorChange={setFillColor}
                />
              )}
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
      
      <ProjectNameDialog
        open={isProjectNameDialogOpen}
        onOpenChange={setIsProjectNameDialogOpen}
        currentName={projectName}
        onSave={handleProjectNameSave}
      />

      <AlertDialog open={showHomeConfirm} onOpenChange={setShowHomeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return to Home?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose any unsaved work. Make sure to save your project first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAppScreen('home');
                setSelectedPages([]);
                setPdfPages([]);
                setCurrentPageIndex(0);
                setSymbolCategories(DEFAULT_SYMBOL_CATEGORIES);
                setCurrentProjectId(null);
                setShowHomeConfirm(false);
              }}
            >
              Go to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Current Page?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose all changes on this page. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Reset all symbol counts
                setSymbolCategories((prev) => prev.map(cat => ({
                  ...cat,
                  symbols: cat.symbols.map(s => ({ ...s, count: 0 }))
                })));

                // Force canvas workspace to reload by toggling the page
                const current = currentPageIndex;
                setCurrentPageIndex(-1);
                setTimeout(() => setCurrentPageIndex(current), 10);
                setShowResetConfirm(false);
              }}
            >
              Reset Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add More Images Dialog */}
      <AlertDialog open={showAddMoreDialog} onOpenChange={setShowAddMoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Image Added</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add another image or return to the canvas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowAddMoreDialog(false);
              setIsAddingToProject(true);
              setAppScreen('template');
            }}>
              Add Another Image
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowAddMoreDialog(false);
              setIsAddingToProject(false);
              setAppScreen('canvas');
            }}>
              Go to Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export PDF Dialog */}
      <ExportPdfDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        totalPages={pdfPages.length}
        onExport={handleExportPages}
      />
    </div>
  );
};

export default Index;
