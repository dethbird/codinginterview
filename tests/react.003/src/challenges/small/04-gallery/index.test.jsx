import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Gallery from './index.jsx'

const imgs = [
  { src: '1.jpg', alt: 'one' },
  { src: '2.jpg', alt: 'two' },
  { src: '3.jpg', alt: 'three' },
]

it('clicking a thumbnail sets the main image', async () => {
  const user = userEvent.setup()
  render(<Gallery images={imgs} />)
  const thumbs = await screen.findAllByRole('button')
  await user.click(thumbs[1])
  expect(screen.getByTestId('main')).toHaveAttribute('src', '2.jpg')
})
