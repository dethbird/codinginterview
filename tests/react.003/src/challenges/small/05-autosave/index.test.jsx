
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutosaveInput from './index.jsx'

beforeEach(() => {
    localStorage.clear();
});

it('saves after a pause (blur as a simple trigger for test)', async () => {
    const user = userEvent.setup()
    render(<AutosaveInput storageKey="k" />)

    const input = screen.getByLabelText('text')
    await user.type(input, 'hi')

    // For determinism: force a save without timers.
    input.blur()
    expect(localStorage.getItem('k')).toBe(JSON.stringify('hi'))
})
