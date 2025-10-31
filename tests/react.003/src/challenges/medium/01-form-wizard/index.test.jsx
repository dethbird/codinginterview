
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'


it('intial state on step 1 ', async () => {
    const user = userEvent.setup()
    render(<FormWizard />)

    // starts on step one
    expect(screen.getByTestId('step')).toHaveTextContent(`Step 1: Account`);
})

it('next goes to step 2 after validate', async () => {
    const user = userEvent.setup()
    render(<FormWizard />)

    // click next
    const nextButton = await screen.getByLabelText('nextButton')
    await user.click(nextButton)

    expect(screen.getByTestId('step')).toHaveTextContent(`Step 2: Profile`);
})
