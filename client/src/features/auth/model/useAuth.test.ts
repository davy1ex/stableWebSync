import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as any

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: { reload: jest.fn() },
    writable: true,
  });
});

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear()
        mockFetch.mockReset()
    })

    it('success login', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'test-token' })
        })
        const { result } = renderHook(() => useAuth())
        await act(async () => {
            const ok = await result.current.login('user1')
            expect(ok).toBe(true)
        })
        expect(result.current.token).toBe('test-token')
        expect(localStorage.getItem('token')).toBe('test-token')
        expect(localStorage.getItem('username')).toBe('user1')
    })

    it('unsuccess login', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false })
        const { result } = renderHook(() => useAuth())
        await act(async () => {
            const ok = await result.current.login('user2')
            expect(ok).toBe(false)
        })
        expect(result.current.token).toBeNull()
        expect(result.current.error).toBe('Authorization error')
    })

    it('logout', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'test-token' })
        })
        const { result } = renderHook(() => useAuth())
        await act(async () => { await result.current.login('user3') })
        act(() => { result.current.logout() })
        expect(result.current.token).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
    })
}) 