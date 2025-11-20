import { supabase } from "@/integrations/supabase/client";
import { ProjectData, SaveProjectPayload } from "@/types/project";

export interface ProjectMetadata {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const saveProject = async (
  projectData: SaveProjectPayload,
  projectId?: string
): Promise<{ data: ProjectData | null; error: any }> => {
  try {
    const payload = {
      ...projectData,
      page_setup: projectData.page_setup as any,
      symbol_settings: projectData.symbol_settings as any,
      symbol_categories: projectData.symbol_categories as any,
      canvas_json: projectData.canvas_json as any,
    };

    if (projectId) {
      // Update existing project
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      return { data: data as any, error };
    } else {
      // Create new project
      const { data, error } = await supabase
        .from("projects")
        .insert(payload)
        .select()
        .single();

      return { data: data as any, error };
    }
  } catch (error) {
    console.error("Error saving project:", error);
    return { data: null, error };
  }
};

export const loadProject = async (
  projectId: string
): Promise<{ data: ProjectData | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    return { data: data as any, error };
  } catch (error) {
    console.error("Error loading project:", error);
    return { data: null, error };
  }
};

export const listProjects = async (): Promise<{
  data: ProjectMetadata[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, created_at, updated_at")
      .order("updated_at", { ascending: false });

    return { data, error };
  } catch (error) {
    console.error("Error listing projects:", error);
    return { data: null, error };
  }
};

export const deleteProject = async (
  projectId: string
): Promise<{ error: any }> => {
  try {
    // First, get the project to find associated files
    const { data: project } = await supabase
      .from("projects")
      .select("background_image_url")
      .eq("id", projectId)
      .single();

    // Delete associated files from storage if they exist
    if (project?.background_image_url) {
      const filePath = project.background_image_url.split("/").pop();
      if (filePath) {
        await supabase.storage.from("floor-plans").remove([filePath]);
      }
    }

    // Delete the project record
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    return { error };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { error };
  }
};

export const uploadFloorPlan = async (
  file: File,
  projectId: string
): Promise<{ data: { path: string } | null; error: any }> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${projectId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from("floor-plans")
      .upload(filePath, file, {
        upsert: true,
      });

    return { data, error };
  } catch (error) {
    console.error("Error uploading floor plan:", error);
    return { data: null, error };
  }
};

export const getFloorPlanUrl = (path: string): string => {
  const { data } = supabase.storage.from("floor-plans").getPublicUrl(path);
  return data.publicUrl;
};
