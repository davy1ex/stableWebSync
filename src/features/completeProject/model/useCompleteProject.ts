import { useProjectStore } from "@/entities/project";
import { usePointsStore } from "@/entities/points";

export const useCompleteProject = () => {
    return (projectId: number) => {
        const project = useProjectStore.getState().projects.find(p => p.projectId === projectId);
        const totalPoints = usePointsStore.getState().totalPoints;
        const setTotalPoints = usePointsStore.getState().setTotalPoints;

        if (!project) return;

        setTotalPoints(totalPoints + project.projectPoints);

        useProjectStore.setState({
            projects: useProjectStore.getState().projects.map(p =>
                p.projectId === projectId ? { ...p, status: "completed" as const } : p
            ),
        });
    };
};