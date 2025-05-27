import { ListColumn } from "../ListColumn/ListColumn"
import { TaskList } from "../TaskList/TaskList"
import "./Board.css"

export const Board = () => {
    return (
        <div className="boardContainer">
            <ListColumn children={<TaskList title="Inbox"/>} />
            <ListColumn children={<TaskList title="Inbox"/>} />
            <ListColumn children={<TaskList title="Inbox"/>} />
        </div>

    )
}