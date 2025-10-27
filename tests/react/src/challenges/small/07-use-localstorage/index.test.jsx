import { renderHook, act } from '@testing-library/react'
import useLocalStorage from './index.jsx'

it('persists updates', () => {
  const { result } = renderHook(() => useLocalStorage('k', 1))
  act(() => result.current[1](2))
  const { result: again } = renderHook(() => useLocalStorage('k', 0))
  expect(again.current[0]).toBe(2)
})
