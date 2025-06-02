import { useState, useRef, useEffect } from "react";
import { useAddTask } from "../model/useAddTask";
import { useHotkey } from "../model/useHotkeys";

type TaskInputProps = {
    columnId: string
    projectId: number | null
}

export const TaskInput = ({ columnId, projectId }: TaskInputProps) => {
    const [taskInputed, setTaskInputed] = useState("");
    const taskInputRef = useRef(taskInputed); 
    const inputRef = useRef<HTMLInputElement>(null);
    const addInputedTask = useAddTask();

    useEffect(() => {
        taskInputRef.current = taskInputed;
    }, [taskInputed]);

    useHotkey({
        key: "Enter", 
        ref: inputRef as React.RefObject<HTMLElement>,        
        callback: () => {
            const value = taskInputRef.current.trim();
            if (value !== "") {
                addInputedTask(value, columnId, projectId);
                setTaskInputed(""); // clears input
            }
        }
    });

    return (
        <>
            <input 
                type="text"
                ref={inputRef}
                value={taskInputed}
                onChange={(e) => setTaskInputed(e.target.value)} 
                placeholder="Add a task"
            /> 
            <button onClick={() => {
                const value = taskInputed.trim();
                if (value !== "") {
                    addInputedTask(value, columnId, projectId);
                    setTaskInputed("");
                }
            }}>+</button>
        </>
    )
}
