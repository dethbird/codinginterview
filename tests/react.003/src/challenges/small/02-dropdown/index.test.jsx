
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dropdown from './index.jsx'

it('opens and selects with keyboard ArrowDown and Enter', async () => {
	const user = userEvent.setup()
	const onSelect = vi.fn()
	render(<Dropdown items={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} onSelect={onSelect} />)

	await user.click(screen.getByRole('button', { name: /menu/i }))
	expect(screen.getByRole('listbox')).toBeInTheDocument()
	
	await user.keyboard('{ArrowDown}{Enter}')
	expect(onSelect).toHaveBeenCalledWith(2)
})

it('Can navigate up and down using ArrowUp and ArrowDown keys', async () => {
	const user = userEvent.setup()
	const onSelect = vi.fn()
	render(<Dropdown items={[
		{ id: 1, label: 'A' },
		{ id: 2, label: 'B' },
		{ id: 3, label: 'C' }
	]} onSelect={onSelect} />)
	await user.click(screen.getByRole('button', { name: /menu/i }))
	
	await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
	expect(onSelect).toHaveBeenCalledWith(3)

	await user.keyboard('{ArrowUp}{Enter}')
	expect(onSelect).toHaveBeenCalledWith(2)
})

it('Closes when {Escape} key is pressed', async () => {
	const user = userEvent.setup()
	const onSelect = vi.fn()
	render(<Dropdown items={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} onSelect={onSelect} />)

	await user.click(screen.getByRole('button', { name: /menu/i }))
	expect(screen.getByRole('listbox')).toBeInTheDocument()
	
	await user.keyboard('{Escape}')
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it ('Closes when clicked outside the dropdown', async () => {
	const user = userEvent.setup()
	render(
		<>
			<button role="button">other</button>
			<Dropdown items={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} />
		</>
	)

	await user.click(screen.getByRole('button', { name: /menu/i }))
	expect(screen.getByRole('listbox')).toBeInTheDocument()
	
	await user.click(screen.getByRole('button', { name: /other/i }))
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

