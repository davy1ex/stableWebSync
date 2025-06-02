import "./ModalWindow.css"

type ModalWindowProps = {
    children: React.ReactNode
    isOpen: boolean
    onClose: () => void
    width?: string
    height?: string
}

export const ModalWindow = ({ children, isOpen, onClose, width="400px", height="400px" }: ModalWindowProps) => {
    return (
        <div className={`modalWindow ${isOpen ? "open" : ""}`}>
            <div className="modalWindowContent" style={{ width, height }}>
                <button className="closeButton" onClick={onClose}>❌</button>
                {children}
            </div>
        </div>
    )
}