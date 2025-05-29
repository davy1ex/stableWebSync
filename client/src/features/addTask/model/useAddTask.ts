import { TaskModel } from "@/entities/task"
import { useTaskStore } from "@/entities/task/model/store"

export const useAddTask = () => {
    const addTask = useTaskStore((state)=>state.addTask)
    const tasks = useTaskStore((state)=>state.tasks)
    
    return (taskName: string, columnId: string) => {
        // Get tasks in the target column and find the highest order
        const columnTasks = tasks
            .filter(t => t.columnId === columnId)
            .sort((a, b) => a.order - b.order);
            
        // Calculate new order
        const order = columnTasks.length === 0 
            ? 1  // First task in column
            : columnTasks[columnTasks.length - 1].order + 1;  // Add to end
            
        const newTask: TaskModel = {
            taskId: Date.now(),
            taskName,
            columnId,
            isCompleted: false,
            order: tasks.length + 1,
            taskPoints: 0
        }
        
        addTask(newTask)
    }
}
