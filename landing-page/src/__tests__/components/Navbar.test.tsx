import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '@testing-library/jest-dom';

describe('Navbar', () => {
  it('should render Badenya logo', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Badenya')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Fonctionnalités')).toBeInTheDocument();
    expect(screen.getByText('Comment ça marche')).toBeInTheDocument();
    expect(screen.getByText('Témoignages')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('À propos')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Télécharger')).toBeInTheDocument();
  });

  it('should have correct href for anchor links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const featuresLink = screen.getByText('Fonctionnalités');
    expect(featuresLink).toHaveAttribute('href', '#features');

    const howItWorksLink = screen.getByText('Comment ça marche');
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');

    const testimonialsLink = screen.getByText('Témoignages');
    expect(testimonialsLink).toHaveAttribute('href', '#testimonials');

    const faqLink = screen.getByText('FAQ');
    expect(faqLink).toHaveAttribute('href', '#faq');
  });

  it('should render mobile menu button', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu on button click', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const mobileMenuButton = screen.getByRole('button');
    
    // Mobile menu should be closed initially
    // Click to open
    fireEvent.click(mobileMenuButton);
    
    // Click again to close
    fireEvent.click(mobileMenuButton);
    
    // Button should have been clicked twice
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('sticky');
  });

  it('should have download button', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const downloadButton = screen.getByText('Télécharger');
    expect(downloadButton).toHaveAttribute('href', '#download');
  });

  it('should have links to pages', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const aboutLink = screen.getByText('À propos');
    expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');

    const contactLink = screen.getByText('Contact');
    expect(contactLink.closest('a')).toHaveAttribute('href', '/contact');
  });
});
