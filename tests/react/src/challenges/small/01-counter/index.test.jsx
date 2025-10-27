import { render, screen, fireEvent } from '@testing-library/react'
import Counter from './index.jsx'

it('increments and decrements by step', () => {
  render(<Counter step={5} initial={10} />)
  const value = () => screen.getByTestId('value')
  fireEvent.click(screen.getByText('+'))
  expect(value()).toHaveTextContent('15')
  fireEvent.click(screen.getByText('-'))
  fireEvent.click(screen.getByText('-'))
  expect(value()).toHaveTextContent('5')
})
