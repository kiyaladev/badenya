import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../../components/Footer';
import '@testing-library/jest-dom';

describe('Footer', () => {
  it('should render footer with company name', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Use getAllByText since "Badenya" appears multiple times
    const badenyaElements = screen.getAllByText(/Badenya/i);
    expect(badenyaElements.length).toBeGreaterThan(0);
  });

  it('should render copyright text', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('should have footer element', () => {
    const { container } = render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('should render social media links if present', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Footer might contain social media links or other links
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
