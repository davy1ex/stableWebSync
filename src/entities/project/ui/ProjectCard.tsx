import { useSortable } from '@dnd-kit/sortable' // TODO make common component for this dragging
import { CSS } from '@dnd-kit/utilities'

import { ProjectModel } from "../model/model"
import { useProjectStore } from "../model/store"
import { ProgressBarByItems } from '@/shared/ui/ProgressBar/ProgressBar'
import "./ProjectCard.css"

type ProjectCardProps = {
    project: ProjectModel   
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    const deleteProject = useProjectStore((state) => state.deleteProject)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: project.projectId.toString(),
    })
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div className="projectCard" ref={setNodeRef} style={style}>
            <div className="dragHandle" {...listeners} {...attributes}>
                ⋮⋮
            </div>
           <div className="projectCardContent">
                <div className="projectCardContentHeader">
                    <div className="projectName">
                        {project.projectName}
                    </div>

                    <div className="projectPoints">
                        🪙 {project.projectPoints}
                    </div>
                    {/* <p>{project.projectDescription}</p> */}
                    
                    <div className="deleteButton" onClick={() => {
                        deleteProject(project.projectId)
                    }}>
                        🗑️
                    </div>     
                </div>
                <div className="projectStatus">
                    {project.status}
                </div>
                <div className="projectStatusBar">
                    <ProgressBarByItems allItems={project.roughPlan.length} completedItems={project.roughPlan.filter(p => p.isCompleted).length} />
                </div>
           </div>
        </div>
    )
}