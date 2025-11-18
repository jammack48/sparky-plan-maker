import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import tradeSketchLogo from "@/assets/tradesketch-logo.png";

interface HomeScreenProps {
  onNewProject: (projectName: string) => void;
  onSkip: () => void;
}

export const HomeScreen = ({ onNewProject, onSkip }: HomeScreenProps) => {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [projectName, setProjectName] = useState("");

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
            disabled
            title="Coming Soon"
          >
            Load Project
            <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>
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
    </div>
  );
};
