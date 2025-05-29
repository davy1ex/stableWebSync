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
    const toggleTaskCompleted = useTaskStore((s) => s.toggleTaskCompleted)
    const updateTask = useTaskStore((state) => state.updateTask)
    const deleteTask = useTaskStore((state) => state.deleteTask)

    const [isToggling, setIsToggling] = useState(false)
    const [taskName, setTaskName] = useState(task.taskName)
    const [taskPoints, setTaskPoints] = useState(task.taskPoints)
    const [isEditingTaskName, setIsEditingTaskName] = useState(false)
    const [isEditingTaskPoints, setIsEditingTaskPoints] = useState(false)
    
    
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsEditingTaskName(false)
        setIsEditingTaskPoints(false)
        updateTask({...task, taskName: taskName, taskPoints: taskPoints})
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
            {!isEditingTaskName && (
                <div className="taskName" onClick={()=> {setIsEditingTaskName(true)}}>
                    {task.taskName}
                </div>
            )}

            {isEditingTaskName && (
                <div className="taskEdit">
                    <form onSubmit={handleSubmit}>
                        <input type="text" value={taskName} onChange={(e) => {
                            setTaskName(e.target.value)
                        }} />
                    </form>
                </div>
            )}

            {!isEditingTaskPoints && (
                <div className="taskPoints" onClick={()=> {setIsEditingTaskPoints(true)}}>
                    🪙{taskPoints}
                </div>
            )}

            {isEditingTaskPoints && (
                <div className="taskPoints" onClick={()=> {setIsEditingTaskPoints(true)}}>
                    <form onSubmit={handleSubmit}>
                        <input type="number" value={taskPoints} onChange={(e) => {
                            if (Number(e.target.value) > 0) {
                                setTaskPoints(Number(e.target.value))
                            } else {
                                setTaskPoints(0)
                            }
                        }} />
                    </form>
                </div>
            )}

            <div className="deleteButton" onClick={() => {
                deleteTask(task.taskId)
            }}>
                🗑️
            </div>
        </div>
    )
}