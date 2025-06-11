import { create } from "zustand";
import { ProjectModel } from "./model";
import { createJSONStorage, persist } from "zustand/middleware";

type ProjectStore = {
    projects: ProjectModel[]
    setProject: (project: ProjectModel) => void
    addProject: (project: ProjectModel) => void
    deleteProject: (projectId: number) => void
    updateProject: (project: ProjectModel) => ProjectModel[]
    updateProjects: (projects: ProjectModel[]) => void
    updateProjectRoughPlan: (projectId: number, roughPlan: Array<{
        todo: string, isCompleted: boolean
    }>) => void
    toggleRoughPlanItem: (projectId: number, roughPlanItem: { todo: string, isCompleted: boolean }) => void
}

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            projects: [],

            setProject: (project: ProjectModel) => 
                set({ projects: [...get().projects, project] }),
            addProject: (project: ProjectModel) => 
                set((state) => ({ projects: [...state.projects, project] })),
            deleteProject: (projectId: number) => 
                set((state) => ({ 
                    projects: state.projects.filter((project) => project.projectId !== projectId) 
                
                })
            ),
            updateProject: (project: ProjectModel) => {
                set((state) => ({ 
                    projects: state.projects.map((p) => p.projectId === project.projectId ? project : p) 
                }))
                return get().projects.map((p) => p.projectId === project.projectId ? project : p) 
            },
            updateProjects: (projects: ProjectModel[]) => 
                set({ projects }),
            updateProjectRoughPlan: (projectId: number, roughPlan: { todo: string, isCompleted: boolean }[]) => 
                set((state) => ({ projects: state.projects.map((p) => p.projectId === projectId ? { ...p, roughPlan } : p) })),
            toggleRoughPlanItem: (projectId: number, roughPlanItem: { todo: string, isCompleted: boolean }) => 
                set((state) => ({
                    projects: state.projects.map(
                        (p) => p.projectId === projectId 
                            ? { ...p, 
                                roughPlan: p.roughPlan.map((rp) => rp.todo === roughPlanItem.todo ? { ...rp, isCompleted: !rp.isCompleted } : rp) } 
                            : p) })),
        }),

        {
            name: "projects",
            storage: createJSONStorage(() => localStorage)
        }
    )
)
