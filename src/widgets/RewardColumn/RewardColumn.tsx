import {DndContext, DragEndEvent} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { RewardComponent, useRewardStore } from "@/entities/reward"
import { RewardInput } from "@/features/addReward"
import './RewardColumn.css'

export const RewardColumn = () => {
    const rewards = useRewardStore(state => state.rewards)
    const updateRewards = useRewardStore(state => state.updateRewards)
    const stored = rewards.sort((a, b) => a.order - b.order)

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = rewards.findIndex(r => r.rewardId.toString() === active.id)
        const newIndex = rewards.findIndex(r => r.rewardId.toString() === over.id)

        if (oldIndex === -1 || newIndex === -1) return

        const newRewards = arrayMove(rewards, oldIndex, newIndex)
        const reordered = newRewards.map((reward, index) => ({
            ...reward,
            order: index + 1
        }))
        updateRewards(reordered)
        
        console.log("now", reordered)
    }

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
                items={rewards.map(reward => reward.rewardId.toString())}
                strategy={verticalListSortingStrategy}
            >
                <div className="rewardsColumn"> 
                    <RewardInput />
                    {stored.map((reward) => (
                        <RewardComponent key={reward.rewardId} reward={reward}/>
                    ))}
                </div>

            </SortableContext>
            
        </DndContext>
        
    )
}