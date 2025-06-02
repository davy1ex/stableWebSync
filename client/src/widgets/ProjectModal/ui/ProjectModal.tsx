import { useState } from "react"
import { useProjectStore } from "@/entities/project"
import { ModalWindow } from "@/shared/ui/ModalWindow"
import { ProgressBarByItems } from "@/shared/ui/ProgressBar/ProgressBar"
import { TaskList } from "@/widgets/TaskList"
import { useTaskStore } from "@/entities/task"
import { AddTaskFromModal } from "./AddTaskFromModal"
import "./ProjectModal.css"

type ProjectModalProps = {
    projectId: number
    isOpen: boolean
    onClose: () => void
}

export const ProjectModal = ({ projectId, isOpen, onClose }: ProjectModalProps) => {
    const project = useProjectStore(state => state.projects.find(p => p.projectId === projectId))
    const tasks = useTaskStore(state => state.tasks)
    const updateTask = useTaskStore(state => state.updateTask)

    const [inputedRoughPlan, setInputedRoughPlan] = useState("")
    const updateProject = useProjectStore(state => state.updateProject)
    
    const [isProjectNameEditing, setIsProjectNameEditing] = useState(false)
    const [inputedProjectName, setInputedProjectName] = useState(project?.projectName)
    
    const [isDescriptionEditing, setIsDescriptionEditing] = useState(false)

    const [isPointsEditing, setIsPointsEditing] = useState(false)
    const [inputedPoints, setInputedPoints] = useState(project?.projectPoints)

    const toggleRoughPlanItem = useProjectStore(state => state.toggleRoughPlanItem)

    const handleAddRoughPlan = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!project) return
        updateProject({ ...project, roughPlan: [...project.roughPlan, { todo: inputedRoughPlan, isCompleted: false }] })
        setInputedRoughPlan("")
    }

    const handleUpdatePoints = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!project) return
        updateProject({ ...project, projectPoints: inputedPoints || 0 })
        setIsPointsEditing(false)
    }

    const handleUpdateProjectName = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!project) return
        updateProject({ ...project, projectName: inputedProjectName || "" })
        setIsProjectNameEditing(false)
    }

    const handleUpdateDescription = (inputedDescription: string) => {
        if (!project) return
        updateProject({ ...project, projectDescription: inputedDescription || "" })
    }
    
    if (!project) return null
    return (
        <>
            <ModalWindow isOpen={isOpen} onClose={onClose} width="600px" height="600px">
                <div className="projectModalContent">
                    <div className="projectModalName">
                        {!isProjectNameEditing && (
                            <h1 onClick={() => setIsProjectNameEditing(true)}>{project?.projectName}</h1>
                        )}
                        {isProjectNameEditing && (
                                <form onSubmit={handleUpdateProjectName}>
                                    <input type="text" value={inputedProjectName} onChange={(e) => setInputedProjectName(e.target.value)} />
                                    <button type="submit">Update</button>
                                </form>
                        )}
                    </div>
                    <div className="projectDescription" onClick={() => setIsDescriptionEditing(true)}>
                        {!isDescriptionEditing && (
                            project?.projectDescription.length > 0 ? (
                                <>
                                    {project.projectDescription.split("\n").map((line, index) => (
                                        <>
                                            {line}
                                            <br />
                                        </>
                                    ))}
                                </>
                            ) : (
                                <p>Click for start create description</p>
                            )
                        )}
                        {isDescriptionEditing && (
                            <div className="projectDescriptionEdit">
                                <textarea 
                                    className="projectDescriptionTextarea"
                                    value={project?.projectDescription} 
                                    onChange={(e) => handleUpdateDescription(e.target.value)}
                                    style={{
                                        height: "150px",
                                        width: "100%",        
                                        resize: "vertical",      
                                        overflowY: "auto", 
                                      }}
                                />
                            </div>
                            
                        )}
                    </div>
                    <div className="projectStatus">
                        <ProgressBarByItems allItems={project?.roughPlan.length || 0} completedItems={project?.roughPlan.filter(p => p.isCompleted).length || 0} />

                        {!isPointsEditing && (
                            <div className="projectPoints" onClick={() => setIsPointsEditing(true)}>
                                🪙 {project?.projectPoints}
                            </div>
                        )}
                        
                        {isPointsEditing && (
                            <form onSubmit={handleUpdatePoints}>
                                <input type="number" value={inputedPoints} onChange={(e) => setInputedPoints(Number(e.target.value))} />
                                <button type="submit">Update</button>
                            </form>
                        )}
                    </div>
                    
                    

                    <div className="projectRoughPlan">
                        <h2>Rough Plan</h2>
                        {project?.roughPlan && project.roughPlan.map((plan) => (
                            <div key={plan.todo} className="roughPlanItem">
                                <input type="checkbox" checked={plan.isCompleted} onChange={() => toggleRoughPlanItem(project.projectId, {...plan, isCompleted: !plan.isCompleted})}/> {plan.todo}
                                <div className="deleteButton" onClick={() => {
                                    updateProject({ ...project, roughPlan: project.roughPlan.filter(p => p.todo !== plan.todo) })
                                }}>
                                    🗑️
                                </div> {/* TODO: add points */}
                                {/* <p>{plan.points}</p> */}
                            </div>
                        ))}
                        
                        {project?.roughPlan && project.roughPlan.length === 0 && (
                            <>
                                <p>No rough plan found. U can fill it for clear understanding of the project</p>
                            </>
                        )}

                        <form onSubmit={handleAddRoughPlan}>
                            <input 
                                type="text" 
                                placeholder="Add a rough plan" 
                                value={inputedRoughPlan}
                                onChange={(e) => setInputedRoughPlan(e.target.value)}
                            />
                            <button type="submit">Add</button>
                        </form> 

                        
                    </div>
                    <div className="projectTasks" style={{overflowY: "scroll"}}>
                        <div className="projectTasksList">
                            <h2>Tasks</h2>
                            <TaskList title="Tasks" columnId="" projectId={project?.projectId} showTitle={false} showAddTask={false}/>
                        </div>
                        {/* <HandleInputExistedTask tasks={tasks} projectId={project?.projectId} /> */}
                        <AddTaskFromModal tasks={tasks} project={project} />
                    </div>
                </div>
            </ModalWindow>
        </>
    )
}