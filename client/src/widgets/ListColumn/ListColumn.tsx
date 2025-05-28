import {DndContext, DragEndEvent} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTaskStore } from "@/entities/task"
import "./ListColumn.css"

type ListColumnProps = {
    id: string,
    children: React.ReactNode
}

export const ListColumn = ({id, children}: ListColumnProps) => {
    const tasks = useTaskStore(state => state.tasks)
    const updateTasks = useTaskStore(state => state.updateTasks)
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = tasks.findIndex(t => t.taskId.toString() === active.id)
        const newIndex = tasks.findIndex(t => t.taskId.toString() === over.id)

        if (oldIndex === -1 || newIndex === -1) return

        const newTasks = arrayMove(tasks, oldIndex, newIndex)
        const reordered = newTasks.map((task, index) => ({
            ...task,
            order: index + 1
        }))
        updateTasks(reordered)
        
        console.log("now", reordered)
    }

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
                items={tasks.map(task => task.taskId.toString())}
                strategy={verticalListSortingStrategy}
            >
                <div className="listColumnContainer"> 
                <div className="listColumnTitle">
                    {id}
                </div>
                {children} 
            </div>
            </SortableContext>
        </DndContext>
            
    )
}