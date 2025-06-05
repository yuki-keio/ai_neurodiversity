import { render, screen } from '@testing-library/react';
import PatternCard from '../PatternCard';

test('renders PatternCard component', () => {
	render(<PatternCard />);
	const element = screen.getByText(/pattern card/i);
	expect(element).toBeInTheDocument();
});