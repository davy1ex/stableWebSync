import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskModel } from "../model/TaskModel"
import { useTaskStore } from "../model/store"
import { useState } from 'react'
import "./TaskComponent.css"

type TaskComponentProps = {
    task: TaskModel
}

export const TaskComponent = ({task}: TaskComponentProps) => {
    const [isToggling, setIsToggling] = useState(false)
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

    const handleToggle = async (e: React.MouseEvent) => {
        // Stop propagation to prevent drag handler from catching the click
        e.stopPropagation()
        console.log("toggle")
        if (isToggling) return // Prevent multiple toggles while processing
        
        setIsToggling(true)
        try {
            await toggleTaskCompleted(task.taskId)
        } catch (error) {
            console.error('Failed to toggle task:', error)
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <div className="taskContainer" ref={setNodeRef} style={style}>
            {/* Drag handle area */}
            <div className="dragHandle" {...listeners} {...attributes}>
                ⋮⋮
            </div>
            
            {/* Checkbox area - no drag handlers */}
            <div className="taskCheckbox" onClick={handleToggle}>
                <input 
                    type="checkbox" 
                    checked={task.isCompleted}
                    disabled={isToggling}
                    onChange={() => {}} // Controlled component needs onChange
                />
            </div>
            
            {/* Task name - part of drag handle */}
            <div className="taskName" style={{ opacity: isToggling ? 0.5 : 1 }} {...listeners} {...attributes}>
                {task.taskName}
            </div>
        </div>
    )
}