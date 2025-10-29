
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

it('changes value when arrow keys are pressed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StarRating max={5} onChange={onChange} />)

    const stars = await screen.findAllByRole('button')

    // hover over three then UP to 4
    await user.hover(stars[3])

    expect(stars[3]).toHaveAttribute('data-preview', 'true')
    // click to commit the hover preview (set value to 4)
    await user.click(stars[3])
    expect(onChange).toHaveBeenCalledWith(4)

    // now with focus, ArrowUp should increase to 5
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenCalledWith(5)

    // ArrowDown should decrease back to 4
    await user.keyboard('{ArrowDown}')
    expect(onChange).toHaveBeenCalledWith(4)

})
