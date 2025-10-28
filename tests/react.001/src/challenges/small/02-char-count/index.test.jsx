import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextareaWithCount from './index.jsx'

it('disables submit when over max', async () => {
	// setup
	const user = userEvent.setup()
	render(<TextareaWithCount max={5} />)

	// run
	const textarea = screen.getByLabelText('message')
	await user.type(textarea, 'abcdef')

	// assert
	expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
})

it ('sets counter color to crimson when over', async () => {
	// setup
	const user = userEvent.setup()
	render(<TextareaWithCount max={200} />)
	let tooLong = () => {
		let x = 'x'
		for(let i = 0; i < 200; i++) {
			x = x + 'x';
		}
		return x;
	}

	// run
	const textarea = screen.getByLabelText('message')
	const counter = screen.getByLabelText('counter')
	await user.type(textarea, tooLong())

	// assert
	expect(screen.getByText(/201 /)).toBeInTheDocument()
	expect(window.getComputedStyle(counter).color === 'rgb(220, 20, 60)');
});
