
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

it('sets aria-current to true for active thumbnail', async () => {
    const user = userEvent.setup()
    render(<Gallery images={imgs} />)

    const thumbs = await screen.findAllByRole('button')
    await user.click(thumbs[2])
    expect(thumbs[2]).toHaveAttribute('aria-current', "true")
})

it('Keyboard left/right changes active image', async () => {
    const user = userEvent.setup()
    render(<Gallery images={imgs} />)
    const thumbs = await screen.findAllByRole('button')

    // ensure focus
    await user.click(thumbs[0])

    await user.keyboard('{ArrowRight}');
    expect(thumbs[1]).toHaveAttribute('aria-current', "true")
})
