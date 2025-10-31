
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormWizard from './index.jsx'
import { expect } from 'vitest'


it('intial state on step 1 ', async () => {
    render(<FormWizard />)

    // starts on step one
    expect(screen.getByTestId('step')).toHaveTextContent(`Step 1: Account`);
})

it('happy path succeeds through submit', async () => {
    const user = userEvent.setup()
    render(<FormWizard />)

    // simulate entering email and password
    const emailInput = screen.getByLabelText('email')
    await user.type(emailInput, 'user@example.com')

    const passwordInput = screen.getByLabelText('password')
    await user.type(passwordInput, 'mypassword')

    // click next
    const nextButton = screen.getByLabelText('nextButton')
    await user.click(nextButton)

    expect(screen.getByTestId('step')).toHaveTextContent(`Step 2: Profile`);

    // simulate entering name and city
    const nameInput = screen.getByLabelText('name')
    await user.type(nameInput, 'David Coldplay')

    const cityInput = screen.getByLabelText('city')
    await user.type(cityInput, 'Dos Bananas')

    await user.click(nextButton)

    expect(screen.getByTestId('step')).toHaveTextContent(`Step 3: Confirm`);
    expect(screen.getByTestId('confirm')).toBeInTheDocument();
    expect(screen.getByLabelText('nextButton')).toHaveTextContent('Submit')

    await user.click(nextButton)
    expect(screen.getByTestId('submitConfirm')).toBeInTheDocument();
    expect(screen.queryByTestId('step')).not.toBeInTheDocument();

})

it ('displays errors when they exist', async () => {
    const user = userEvent.setup()
    render(<FormWizard />)

    // simulate entering email and password
    const emailInput = screen.getByLabelText('email')
    await user.type(emailInput, 'NOTANEMAIL')

    expect(await screen.findByTestId('emailError')).toBeInTheDocument()
    expect(await screen.findByTestId('passwordError')).toBeInTheDocument()
})
