import { useCallback, useState } from "react"
import { TaskModel, useTaskStore } from "@/entities/task"
import { ProjectModel, useProjectStore } from "@/entities/project"
import { useAddTask } from "@/features/addTask/model/useAddTask"
import "./AddTaskFromModal.css"

type AddTaskFromModalProps = {
    tasks: TaskModel[]
    project: ProjectModel
}

export const AddTaskFromModal = ({tasks, project}: AddTaskFromModalProps) => {
    const [intputedExistedTask, setIntputedExistedTask] = useState("")
    const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null)

    const [showAttachmentTasks, setShowAttachmentTasks] = useState(false)
    const updateTask = useTaskStore(state => state.updateTask)
    const updateProject = useProjectStore(state => state.updateProject)
    const addTask = useAddTask()
    // const task = tasks.find(t => t.taskName.toLowerCase().includes(intputedExistedTask.toLowerCase()))
    const handleAddTask = (task: TaskModel | null | string) => {
        if (typeof task === "string") {
            console.log("adding new task")
            addTask(intputedExistedTask, "Backlog", project.projectId)
            return
        }
        
        if (!project || !task) return
        updateProject({ ...project, tasks: [...project.tasks, task] })
        updateTask({ ...task, projectId: project.projectId })
    }

    const handleUnattachTask = (task: TaskModel) => {
        if (!project || !task) return
        updateProject({ ...project, tasks: project.tasks.filter(t => Number(t.taskId) !== Number(task.taskId)) })
        updateTask({ ...task, projectId: null })

        // console.log("unattached task", task)
        console.log("project", project)
        console.log(`project.tasks.filter(t => t.taskId !== task.taskId) taskId: ${task.taskId}, `)
        // console.log("now it seems like this", project)
    }
   return (
    <>
            <div className="selectTasks" style={{overflowY: "scroll", maxHeight: "200px" }}>
            
                <input 
                    type="text" 
                    value={intputedExistedTask} 
                    onChange={(e) => setIntputedExistedTask(e.target.value)} 
                    placeholder="Search task" 
                    onFocus={() => setShowAttachmentTasks(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.stopPropagation()
                            setSelectedTask(null)
                            handleAddTask(intputedExistedTask)
                        }
                        
                    }}
                />

                {showAttachmentTasks && (
                    <div className="selectTasksList">

                        {tasks.map(task => (task.projectId === project.projectId 
                            ? (
                                <div key={task.taskId} onClick={() => handleAddTask(task)}>
                                    <p >{task.taskName}</p> <button onClick={(e) => {
                                        e.stopPropagation()
                                        handleUnattachTask(task)
                                    }}>❌</button>
                                </div>
                            ) 
                            : ""
                        ))}
                    </div>
                )}

                { intputedExistedTask && tasks.filter(t => t.taskName.toLowerCase().includes(intputedExistedTask.toLowerCase())).map(task => (
                    <div key={task.taskId} onClick={() => handleAddTask(task)}  className="selectTask">
                        {task.taskName}
                    </div>
                ))}
            </div>
        
    </>
   )
}