import "./ListColumn.css"

type ListColumnProps = {
    children: React.ReactNode
}

export const ListColumn = ({children}: ListColumnProps) => {
    return (
        <div className="listColumnContainer"> 
            {children} 
        </div>
    )
}