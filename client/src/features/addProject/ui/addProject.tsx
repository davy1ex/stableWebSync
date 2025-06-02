import { useState } from "react"
import { useAddProject } from "../model/useAddProject"


export const AddProject = () => {
    const addProject = useAddProject()
    const [projectName, setProjectName] = useState("")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        addProject(projectName)
        setProjectName("")
    }
    
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <button type="submit">Add Project</button>
            </form>
        </div>
    )
}