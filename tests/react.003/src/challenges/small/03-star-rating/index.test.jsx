import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating from './index.jsx'

it('hover previews and click commits', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<StarRating max={5} onChange={onChange} />)
  const stars = await screen.findAllByRole('button')
  await user.hover(stars[3])
  expect(stars[3]).toHaveAttribute('data-preview', 'true')
  await user.click(stars[3])
  expect(onChange).toHaveBeenCalledWith(4)
})
