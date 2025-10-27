import { render, screen } from '@testing-library/react'
import InfiniteList from './index.jsx'

it('renders without crashing (IO mocked by JSDOM as noop)', () => {
  // JSDOM has no IntersectionObserver by default; you could polyfill for full tests.
  render(<InfiniteList />)
  expect(screen.getByText('Loading…')).toBeInTheDocument()
})
