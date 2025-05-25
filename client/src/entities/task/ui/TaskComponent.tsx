import { TaskModel } from "../model/TaskModel"
import { useTaskStore } from "../model/store"

type TaskComponentProps = {
    task: TaskModel
}

export const TaskComponent = ({task}: TaskComponentProps) => {
    const toggleTaskCompleted = useTaskStore((s) => s.toggleTaskCompleted)
    return (
        <div className="taskContainer">
            <div className="taskCheckbox">
                <input 
                    type="checkbox" 
                    checked={task.isCompleted} 
                    onChange={() => toggleTaskCompleted(task.taskId)} 
                />
            </div>
            <div className="taskName">
                {task.taskName}
            </div>
        </div>
    )
}