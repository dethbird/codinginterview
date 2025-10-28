import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './index.jsx';

beforeEach(() => { 
	localStorage.clear();
});

it('increments and decrements by step', () => {
	render(<Counter step={5} initial={10} />);

	// value checker
	const value = () => screen.getByTestId('value');

	fireEvent.click(screen.getByText('+'));
	expect(value()).toHaveTextContent('15');

	fireEvent.click(screen.getByText('-'));
	fireEvent.click(screen.getByText('-'));
	expect(value()).toHaveTextContent('5');
});

it('Reset returns to `initial` (default 0)', () => {
	render(<Counter step={7} initial={47} />);
	const value = () => screen.getByTestId('value');

	fireEvent.click(screen.getByText('+'));
	fireEvent.click(screen.getByText('-'));
	fireEvent.click(screen.getByText('-'));
	fireEvent.click(screen.getByText('Reset'));

	expect(value()).toHaveTextContent('47'); // intial value

});

it('Bonus: persist to localStorage under key `counter:value`', () => {
	render(<Counter step={5} initial={10} />);

	const value = () => screen.getByTestId('value');

	// 
	expect(value()).toHaveTextContent('10');
	expect(localStorage.getItem('counter:value')).toBe('10');

	fireEvent.click(screen.getByText('+'));
});