import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './NotFound';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotFound Component', () => {
  it('should render 404 heading', () => {
    renderWithRouter(<NotFound />);
    
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('should render page not found message', () => {
    renderWithRouter(<NotFound />);
    
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should render description text', () => {
    renderWithRouter(<NotFound />);
    
    expect(screen.getByText("The page you are looking for doesn't exist or has been moved.")).toBeInTheDocument();
  });

  it('should render Back to Home link', () => {
    renderWithRouter(<NotFound />);
    
    const homeLink = screen.getByRole('link', { name: 'Back to Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have proper heading hierarchy', () => {
    renderWithRouter(<NotFound />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Page Not Found');
  });

  it('should be accessible', () => {
    const { container } = renderWithRouter(<NotFound />);
    
    // Check for semantic HTML
    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeInTheDocument();
  });
});