
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dropdown from './index.jsx'

it('opens and selects with keyboard', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(<Dropdown items={[{id:1,label:'A'},{id:2,label:'B'}]} onSelect={onSelect} />)
  await user.click(screen.getByRole('button', { name: /menu/i }))
  expect(screen.getByRole('listbox')).toBeInTheDocument()
  await user.keyboard('{ArrowDown}{Enter}')
  expect(onSelect).toHaveBeenCalledWith(2)
})
