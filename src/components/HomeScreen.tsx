import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import tradeSketchLogo from "@/assets/tradesketch-logo.png";
import { ProjectMetadata } from "@/lib/supabaseService";

interface HomeScreenProps {
  onNewProject: (projectName: string) => void;
  onSkip: () => void;
  savedProjects: ProjectMetadata[];
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const HomeScreen = ({ onNewProject, onSkip, savedProjects, onLoadProject, onDeleteProject }: HomeScreenProps) => {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ projectId: string; projectName: string } | null>(null);

  const handleNewProject = () => {
    setShowNameDialog(true);
    setProjectName("");
  };

  const handleConfirmName = () => {
    const name = projectName.trim() || "Untitled Project";
    setShowNameDialog(false);
    onNewProject(name);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={tradeSketchLogo} alt="TradeSketch Pro" className="w-20 h-20" />
            <h1 className="text-5xl font-bold text-foreground">TradeSketch Pro</h1>
          </div>
          <p className="text-lg text-muted-foreground">Professional floor plan and technical drawing tool</p>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full h-16 text-lg"
            onClick={handleNewProject}
          >
            New Project
          </Button>

          <Button 
            size="lg" 
            variant="secondary"
            className="w-full h-16 text-lg"
            onClick={() => setShowLoadDialog(true)}
          >
            Load Project
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            className="w-full h-16 text-lg"
            onClick={onSkip}
          >
            Skip
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Create precise technical drawings and floor plans with professional tools
        </p>

        {savedProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recent Projects</h2>
            <div className="grid gap-3">
              {savedProjects.map((project) => (
                <Card key={project.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadProject(project.id);
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ projectId: project.id, projectName: project.name });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new project
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmName();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmName}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Select a project to load
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {savedProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No saved projects</p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((project) => (
                  <Card key={project.id} className="p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1" onClick={() => {
                        setShowLoadDialog(false);
                        onLoadProject(project.id);
                      }}>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ projectId: project.id, projectName: project.name });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.projectName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDeleteProject(deleteConfirm.projectId);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
