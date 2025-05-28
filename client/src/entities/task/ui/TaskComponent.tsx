import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskModel } from "../model/TaskModel"
import { useTaskStore } from "../model/store"

type TaskComponentProps = {
    task: TaskModel
}

export const TaskComponent = ({task}: TaskComponentProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: task.taskId.toString(),
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    const toggleTaskCompleted = useTaskStore((s) => s.toggleTaskCompleted)


    return (
        <div className="taskContainer" ref={setNodeRef} style={style} {...listeners} {...attributes}>
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