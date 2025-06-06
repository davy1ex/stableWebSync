import { useEffect, useRef } from "react"
import "./ModalWindow.css"

type ModalWindowProps = {
    children: React.ReactNode
    isOpen: boolean
    onClose: () => void
    width?: string
    height?: string
}

export const ModalWindow = ({ children, isOpen, onClose, width="400px", height="400px" }: ModalWindowProps) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus()
        }
    }, [isOpen])
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                contentRef.current &&
                !contentRef.current.contains(event.target as Node)
            ) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        }, [isOpen, onClose])

    const outsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose()
        }
    }

    return (
        isOpen && (
        <div 
            ref={modalRef}
            className={`modalWindow ${isOpen ? "open" : ""}`} 
            tabIndex={0} 
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    onClose()
                }
            }}
            onClick={(e) => {
                outsideClick(e)
            }}
        >
            <div className="modalWindowContent" ref={contentRef} style={{ width, height }}>
                <button className="closeButton" onClick={onClose}>❌</button>
                {children}
            </div>
        </div>
        )
    )
}