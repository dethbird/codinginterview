import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tabs from './index.jsx'

it('switches tabs', async () => {
  const user = userEvent.setup()
  render(<Tabs tabs={[{label:'A',content:'A'},{label:'B',content:'B'}]} />)
  expect(screen.getByRole('tabpanel')).toHaveTextContent('A')
  await user.click(screen.getByRole('tab', { name: 'B' }))
  expect(screen.getByRole('tabpanel')).toHaveTextContent('B')
})
