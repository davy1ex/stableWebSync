import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskModel } from "../model/TaskModel"
import { useTaskStore } from "../model/store"
import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/entities/project/model/store'
import { useToastStore } from '@/features/showToast'
import "./TaskComponent.css"

type TaskComponentProps = {
    task: TaskModel
}

export const TaskComponent = ({task}: TaskComponentProps) => {
    const toggleTaskCompleted = useTaskStore((s) => s.toggleTaskCompleted)
    const updateTask = useTaskStore((state) => state.updateTask)
    const deleteTask = useTaskStore((state) => state.deleteTask)
    const addToast = useToastStore((state) => state.addToast)

    const [isToggling, setIsToggling] = useState(false)
    const [taskName, setTaskName] = useState(task.taskName)
    const [taskPoints, setTaskPoints] = useState(task.taskPoints)


    const [isNameEditing, setIsNameEditing] = useState(false)
    const [isPointsEditing, setIsPointsEditing] = useState(false)
    const nameEditRef = useRef<HTMLDivElement>(null)
    const pointsEditRef = useRef<HTMLDivElement>(null)
    
    const projectName = useProjectStore((state) => state.projects.find(p => p.projectId === task.projectId)?.projectName)
    
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
            
            if (!task.isCompleted) {
                addToast({
                    message: "Awesome! 🎉",
                    type: "success",
                });
            }
        } catch (error) {
            console.error('Failed to toggle task:', error)
        } finally {
            setIsToggling(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsNameEditing(false)
        setIsPointsEditing(false)
        updateTask({...task, taskName: taskName, taskPoints: taskPoints})
    }

    useEffect(() => {
        // function handleClickOutside(event: MouseEvent) { // TODO: delete it or refactor
        //     if (
        //         isNameEditing && 
        //         nameEditRef.current &&
        //         !nameEditRef.current.contains(event?.target as Node)
        //     ) {
        //         console.log("handleClickOutside", taskName)
        //         setIsNameEditing(false)
        //         setTaskName(task.taskName)
        //         updateTask({...task, taskName: task.taskName})
        //     }
        //     if (
        //         isPointsEditing && 
        //         pointsEditRef.current && 
        //         !pointsEditRef.current.contains(event?.target as Node)
        //     ) {
        //        setIsPointsEditing(false)
        //        setTaskPoints(task.taskPoints)
        //    }
        // }
        

        function handleEscKey(event: KeyboardEvent) {
            if (event.key === 'Escape' && isNameEditing) {
              setIsNameEditing(false)
              setTaskName(task.taskName)
            }
  
            if (event.key === 'Escape' && isPointsEditing) {
              setIsPointsEditing(false)
              setTaskPoints(task.taskPoints)
            }
          }
      
        //   document.addEventListener("mousedown", handleClickOutside)
          document.addEventListener("keydown", handleEscKey)
      
          return () => {
            // document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscKey)
          }
        }, [isNameEditing, isPointsEditing, task.taskName, task.taskPoints])
    

    return (
        <div className="taskContainer">
            <div className="taskContent" ref={setNodeRef} style={style}>
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
                {!isNameEditing && (
                    <div className="taskName" onClick={()=> {setIsNameEditing(true)}}>
                        {task.taskName}
                    </div>
                )}

                {isNameEditing && (
                    <div className="taskEdit" ref={nameEditRef}>
                        <form onSubmit={handleSubmit}>
                            <input type="text" value={taskName} onChange={(e) => {
                                setTaskName(e.target.value)
                            }} />
                        </form>
                    </div>
                )}

                

                <div className="taskAdditional">
                    <div className="taskAdditionalLeft">
                        {!isPointsEditing && (
                            <div className="taskPoints" onClick={()=> {setIsPointsEditing(true)}}>
                                🪙{taskPoints}
                            </div>
                        )}
                        {isPointsEditing && (
                            <div className="taskPoints" ref={pointsEditRef} onClick={()=> {setIsPointsEditing(true)}}>
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
                        {task.projectId && (
                            <div className="taskProjectBadge" onClick={() => {
                                updateTask({...task, projectId: null})
                            }}>
                                <p>{projectName}</p>
                            </div>
                        )}
                    </div>
                    <div className="taskAdditionalRight">
                        <div className="deleteTask" onClick={() => {
                            deleteTask(task.taskId)
                        }}>
                            🗑️
                        </div>
                   </div>
                </div>
            </div>
            
        </div>
        
    )
}