import { useState } from "react"
import {DndContext, DragEndEvent} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable" // TODO make common component for this dragging
import { ProjectCard, ProjectModel, useProjectStore } from "@/entities/project"
import { AddProject } from "@/features/addProject"
import { ProjectModal } from "../ProjectModal/ui/ProjectModal"
import "./ProjectColumn.css"

export const ProjectColumn = () => {
    const projects = useProjectStore(state => state.projects)
    const updateProjects = useProjectStore(state => state.updateProjects)
    const [project, setProject] = useState<ProjectModel | null>(null)

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
                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={projects.map(project => project.projectId.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <AddProject />
                        {projects.map((project) => (
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