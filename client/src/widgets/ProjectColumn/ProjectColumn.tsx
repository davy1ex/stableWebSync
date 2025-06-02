import { useState } from "react"
import {DndContext, DragEndEvent} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable" // TODO make common component for this dragging
import { ProjectCard, ProjectModel, useProjectStore } from "@/entities/project"
import { AddProject } from "@/features/addProject"
import { ProjectModal } from "../ProjectModal/ui/ProjectModal"
import "./ProjectColumn.css"

const statuses = ["notStarted", "active", "waiting", "completed"] // todo make separated as consts

export const ProjectColumn = () => {
    const projects = useProjectStore(state => state.projects)
    const updateProjects = useProjectStore(state => state.updateProjects)
    const [project, setProject] = useState<ProjectModel | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>("notStarted")

    const filteredProjects = projects.filter(project => project.status === selectedStatus)

    const [isOpen, setIsOpen] = useState(false)

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = projects.findIndex(p => p.projectId.toString() === active.id)
        const newIndex = projects.findIndex(p => p.projectId.toString() === over.id)

        if (oldIndex === -1 || newIndex === -1) return

        const newProjects = arrayMove(projects, oldIndex, newIndex)
        const reordered = newProjects.map((project, index) => ({
            ...project,
            order: index + 1
        }))
        updateProjects(reordered)
        
        console.log("now", reordered)
    }

    return (
        <>
            <div className="projectColumn">
                <div className="projectColumnStatusSelect">
                    {statuses.map((status) => (
                        <div 
                            className={`projectColumnStatusItem ${status === selectedStatus ? "active" : ""}`} 
                            key={status} 
                            onClick={() => setSelectedStatus(status)}>
                            {status} {(projects.filter(p => p.status === status)).length}
                        </div>
                    ))}
                </div>
                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={filteredProjects.map(project => project.projectId.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="addProjectContainer">
                            <AddProject />
                        </div>
                        {filteredProjects.map((project) => (
                            <div className="projectCardContainer" key={project.projectId} onClick={() => {
                                setProject(project)
                                setIsOpen(true)
                            }}>
                                <ProjectCard key={project.projectId} project={project} />
                            </div>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

           {project && isOpen && (
                <ProjectModal 
                    projectId={project.projectId} 
                    isOpen={isOpen} 
                    onClose={() => setIsOpen(false)} 
                />
           )}
        </>
    )
}