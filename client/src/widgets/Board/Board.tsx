import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useCallback, useRef } from "react";
import { ListColumn } from "@/widgets/ListColumn/ListColumn"
import { TaskList } from "@/widgets/TaskList/TaskList"
import { useTaskStore } from "@/entities/task"
import { TaskModel } from "@/entities/task"
import { RewardColumn } from '../RewardColumn/RewardColumn';
import { ProjectColumn } from '../ProjectColumn/ProjectColumn';
import "./Board.css"

export const Board = () => {
    const tasks = useTaskStore(state => state.tasks)
    const updateTasks = useTaskStore(state => state.updateTasks)

    const containerRef = useRef<HTMLDivElement>(null)
    const isDown = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)

    const handleMouseDown = (e: React.MouseEvent) => {
        isDown.current = true
        startX.current = e.pageX - (containerRef.current?.offsetLeft || 0)
        scrollLeft.current = containerRef.current?.scrollLeft || 0
    }

    const handleMouseLeave = () => {
        isDown.current = false
    }

    const handleMouseUp = () => {
        isDown.current = false
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !containerRef.current) return
        e.preventDefault()
        const x = e.pageX - containerRef.current.offsetLeft
        const walk = (x - startX.current) * 1 // scroll speed
        containerRef.current.scrollLeft = scrollLeft.current - walk
    }
        
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) return;
    
        const taskId = active.id as number;
        const newColumnId = over.id as string;
        
        // Find the task being dragged
        const draggedTask = tasks.find(t => t.taskId === taskId);
        if (!draggedTask) return;
        
        // Get tasks in the target column
        const columnTasks = tasks
            .filter(t => t.columnId === newColumnId)
            .sort((a, b) => a.order - b.order);
            
        // Calculate new order
        let newOrder: number;
        if (columnTasks.length === 0) {
            newOrder = 1000; // First task in column
        } else {
            // Place at the end of the column
            newOrder = columnTasks[columnTasks.length - 1].order + 1000;
        }
        
        // Update tasks
        const updatedTasks = tasks.map((task: TaskModel) =>
            task.taskId === taskId
                ? {
                    ...task,
                    columnId: newColumnId,
                    order: newOrder
                }
                : task
        );
        
        updateTasks(updatedTasks);
    }, [tasks, updateTasks]);

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div 
                className="boardContainer" 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}>
                <ListColumn id="Inbox" children={<TaskList title="Inbox" columnId="Inbox" projectId={null}/>} />
                <ListColumn id="Backlog" children={<TaskList title="Backlog" columnId="Backlog" projectId={null}/>} />
                <ListColumn id="Projects" children={<ProjectColumn />} />
                <ListColumn id="Rewards" children={<RewardColumn />} />
            </div>
        </DndContext>
    )
}