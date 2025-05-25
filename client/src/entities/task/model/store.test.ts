import { renderHook, act } from '@testing-library/react'
import { useTaskStore } from './store'

describe('useTaskStore', () => {
    it('empty task list on create', () => {
        const { result } = renderHook(() => useTaskStore())

        expect(result.current.tasks).toEqual([])
    })
})