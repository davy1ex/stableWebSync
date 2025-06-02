import "./ProgressBar.css"

type ProgressBarProps = {
    allItems: number
    completedItems: number
}

export const ProgressBarByItems = ({allItems, completedItems}: ProgressBarProps) => {
    const progress = allItems === 0 ? 0 :( (completedItems / allItems) * 100).toFixed(0)
    
    return (
        <div className="progressBarContainer">
            <div className="progressBar">
                <div className="progressBarFill" style={{ width: `${progress}%` }}>
                </div> 
            </div>
            <div className="progressBarText">
                {completedItems} / {allItems}
            </div>
        </div>
    )
}