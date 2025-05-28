import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { ListColumn } from "../ListColumn/ListColumn"
import { TaskList } from "../TaskList/TaskList"
import { useTaskStore } from "@/entities/task"
import { TaskModel } from "@/entities/task"
import { useCallback } from "react";
import "./Board.css"

export const Board = () => {
    const tasks = useTaskStore(state => state.tasks)
    const updateTasks = useTaskStore(state => state.updateTasks)
    
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
            <div className="boardContainer">
                <ListColumn id="inbox1" children={<TaskList title="Inbox" columnId="inbox1"/>} />
                <ListColumn id="inbox2" children={<TaskList title="Inbox" columnId="inbox2"/>} />
                <ListColumn id="inbox3" children={<TaskList title="Inbox" columnId="inbox3"/>} />
            </div>
        </DndContext>
    )
}