type NavItemProps = {
    item: string
    active?: boolean
}

export const NavItem = ({item, active=false}: NavItemProps) => {
    return (
        <div className={
            `headerItem headerItemVertical ${active 
                ? "active" 
                : ""}
        `}>
            {item}
        </div>
    )
}