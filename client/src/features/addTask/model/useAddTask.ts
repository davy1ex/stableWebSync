import { TaskModel } from "@/entities/task"
import { useTaskStore } from "@/entities/task/model/store"

export const useAddTask = () => {
    const addTask = useTaskStore((state)=>state.addTask)
    
    return (taskName: string) => {
        const newTask =  {
            taskId: Date.now(),
            taskName,
            dateBox: "later",
            isCompleted: false
        } as TaskModel
        addTask(newTask)
    }
}
