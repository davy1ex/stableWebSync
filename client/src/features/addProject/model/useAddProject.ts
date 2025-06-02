import { ProjectModel } from "@/entities/project"
import { useProjectStore } from "@/entities/project/model/store"

export const useAddProject = () => {
    const addProject = useProjectStore((state)=>state.addProject)
    const projects = useProjectStore((state)=>state.projects)
    
    return (projectName: string) => {
        // Get tasks in the target column and find the highest order
        const columnTasks = projects
            .sort((a, b) => a.order - b.order);
            
        // Calculate new order
        const order = projects.length === 0 
            ? 1  // First task in column
            : projects[projects.length - 1].order + 1;  // Add to end
            
        const newProject: ProjectModel = {
            projectId: Date.now(),
            projectName,
            projectDescription: "",
            updatedAt: new Date().toISOString(),
            tasks: [],
            roughPlan: [],
            projectPoints: 100,
            status: "notStarted",
            order: projects.length + 1
        }
        
        addProject(newProject)
    }
}
