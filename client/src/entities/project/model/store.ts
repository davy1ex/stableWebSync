import { create } from "zustand";
import { TaskModel } from "@/entities/task";
import { ProjectModel } from "./model";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePointsStore } from "@/entities/Points";

type ProjectStore = {
    projects: ProjectModel[]
    setProject: (project: ProjectModel) => void
    addProject: (project: ProjectModel) => void
    deleteProject: (projectId: number) => void
    updateProject: (project: ProjectModel) => ProjectModel[]
    updateProjects: (projects: ProjectModel[]) => void
    completeProject: (projectId: number) => void
    // updateProjectTasks: (projectId: string, tasks: TaskModel[]) => void
    updateProjectRoughPlan: (projectId: number, roughPlan: Array<{
        todo: string, isCompleted: boolean
    }>) => void
    toggleRoughPlanItem: (projectId: number, roughPlanItem: { todo: string, isCompleted: boolean }) => void
    // updateProjectPoints: (projectId: string, points: number) => void
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
                const preProjectStatus = get().projects.find(p => p.projectId === project.projectId)?.status
                if (preProjectStatus === "completed" && project.status !== "completed") {
                    const totalPoints = usePointsStore.getState().totalPoints
                    const setTotalPoints = usePointsStore.getState().setTotalPoints
                    if (totalPoints > project.projectPoints) {
                        setTotalPoints(totalPoints - project.projectPoints)
                    }
                }
                set((state) => ({ 
                    projects: state.projects.map((p) => p.projectId === project.projectId ? project : p) 
                }))
                return get().projects.map((p) => p.projectId === project.projectId ? project : p) 
            },
            updateProjects: (projects: ProjectModel[]) => 
                set({ projects }),
            updateProjectTasks: (projectId: number, tasks: TaskModel[]) => 
                set((state) => ({ 
                    projects: state.projects.map((p) => p.projectId === projectId ? { ...p, tasks } : p) 
                })
            ),
            updateProjectRoughPlan: (projectId: number, roughPlan: { todo: string, isCompleted: boolean }[]) => 
                set((state) => ({ projects: state.projects.map((p) => p.projectId === projectId ? { ...p, roughPlan } : p) })),
            toggleRoughPlanItem: (projectId: number, roughPlanItem: { todo: string, isCompleted: boolean }) => 
                set((state) => ({
                    projects: state.projects.map(
                        (p) => p.projectId === projectId 
                            ? { ...p, 
                                roughPlan: p.roughPlan.map((rp) => rp.todo === roughPlanItem.todo ? { ...rp, isCompleted: !rp.isCompleted } : rp) } 
                            : p) })),
            updateProjectPoints: (projectId: number) => 
                set((state) => ({ 
                    projects: state.projects.map((p) => p.projectId === projectId ? { ...p, projectPoints: p.projectPoints } : p) })),            
            completeProject: (projectId: number) => {
                const project = get().projects.find(project => project.projectId === projectId)
                if (!project) return 
                
                const totalPoints = usePointsStore.getState().totalPoints
                const setTotalPoints = usePointsStore.getState().setTotalPoints
                setTotalPoints(totalPoints + project.projectPoints)
                
                set((state) => ({
                    projects: state.projects.map(project => 
                        project.projectId === projectId 
                            ? {...project, status: "completed"} 
                            : project)
                }))
            }
        }),

        {
            name: "projects",
            storage: createJSONStorage(() => localStorage)
        }
    )
)
