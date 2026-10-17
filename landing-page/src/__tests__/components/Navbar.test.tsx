import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

describe('Navbar', () => {
  const mount = () => render(<BrowserRouter><Navbar /></BrowserRouter>);
  it('links product from every page to the home section', () => { mount(); expect(screen.getByText('Produit')).toHaveAttribute('href', '/#features'); });
  it('offers a real app destination', () => { mount(); expect(screen.getByText('Ouvrir l’application')).toHaveAttribute('href', 'https://badenya.naimba.com'); });
  it('opens the compact menu and closes it with Escape', () => {
    mount(); const button = screen.getByRole('button', { name: 'Ouvrir le menu' });
    fireEvent.click(button); expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' }); expect(button).toHaveAttribute('aria-expanded', 'false'); expect(button).toHaveFocus();
  });
  it('closes the compact menu when a destination is selected', () => {
    mount(); fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getAllByText('Contact')[1]); expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });
});
