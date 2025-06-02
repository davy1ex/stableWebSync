import { useState } from "react"
import { useAddProject } from "../model/useAddProject"
import "./AddProject.css"

export const AddProject = () => {
    const addProject = useAddProject()
    const [projectName, setProjectName] = useState("")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        addProject(projectName)
        setProjectName("")
    }
    
    return (
        <>
            <form onSubmit={handleSubmit}>
                <input className="addProjectInput" type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <button className="addProjectButton" type="submit">Add Project</button>
            </form>
        </>
    )
}