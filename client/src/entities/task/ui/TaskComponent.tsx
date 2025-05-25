import { useState } from "react"
import {TaskModel} from "../model/TaskModel"

type TaskComponentProps = {
    task: TaskModel
}

export const TaskComponent = ({task}: TaskComponentProps) => {
    const [stateIsCompleted, setStateIsCompleted] = useState(task.isCompleted)
    return (
        <div className="taskContainer">
            <div className="taskCheckbox">
                <input 
                    type="checkbox" 
                    checked={stateIsCompleted} 
                    onChange={()=> setStateIsCompleted(!stateIsCompleted)} 
                />
            </div>
            <div className="taskName">
                {task.taskName}
            </div>
        </div>
    )
}