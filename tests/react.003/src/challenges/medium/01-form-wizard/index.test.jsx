
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'


it('intial state on step 1 ', async () => {
    // const user = userEvent.setup()
    render(<FormWizard />)

    // const prev = await screen.getByLabelText('backButton')
    // starts on step one
    expect(screen.getByTestId('step')).toHaveTextContent(`Step 1: Account`);
})
