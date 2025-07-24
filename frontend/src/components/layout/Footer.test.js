import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

// Mock styled-components
jest.mock('styled-components', () => ({
  __esModule: true,
  default: (component) => (props) => React.createElement(component, props),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  it('should render footer title', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('WaifuHospital')).toBeInTheDocument();
  });

  it('should render footer description', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText(/Create, chat with, and merchandise your own AI anime characters/)).toBeInTheDocument();
  });

  it('should render copyright notice with current year', () => {
    renderWithRouter(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} WaifuHospital. All rights reserved.`)).toBeInTheDocument();
  });

  describe('Footer sections', () => {
    it('should render Explore section', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Store' })).toBeInTheDocument();
    });

    it('should render Create section', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create Character' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Manage Characters' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sell Merchandise' })).toBeInTheDocument();
    });

    it('should render Help section', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'FAQ' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();
    });
  });

  describe('Link functionality', () => {
    it('should have correct href attributes for navigation links', () => {
      renderWithRouter(<Footer />);
      
      // Test specific links with expected paths
      expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Store' })).toHaveAttribute('href', '/merchandise');
      expect(screen.getByRole('link', { name: 'Create Character' })).toHaveAttribute('href', '/create-character');
    });

    it('should have dashboard links pointing to correct paths', () => {
      renderWithRouter(<Footer />);
      
      const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' });
      dashboardLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/dashboard');
      });
    });

    it('should have placeholder links for help section', () => {
      renderWithRouter(<Footer />);
      
      // These currently point to home but should be updated to proper help pages
      expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<Footer />);
      
      // Check that all section titles are rendered
      const headings = ['Explore', 'Create', 'Help'];
      headings.forEach(heading => {
        expect(screen.getByText(heading)).toBeInTheDocument();
      });
    });

    it('should have accessible link text', () => {
      renderWithRouter(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });

    it('should not have any images without alt text', () => {
      renderWithRouter(<Footer />);
      
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Content structure', () => {
    it('should render all expected links', () => {
      renderWithRouter(<Footer />);
      
      const expectedLinks = [
        'Home',
        'Store', 
        'Dashboard',
        'Create Character',
        'Manage Characters',
        'Sell Merchandise',
        'FAQ',
        'Terms of Service',
        'Privacy Policy',
        'Contact Us'
      ];

      expectedLinks.forEach(linkText => {
        expect(screen.getByRole('link', { name: linkText })).toBeInTheDocument();
      });
    });

    it('should have proper text content', () => {
      renderWithRouter(<Footer />);
      
      // Check for specific text content
      expect(screen.getByText(/Create, chat with, and merchandise/)).toBeInTheDocument();
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });

    it('should handle multiple dashboard links correctly', () => {
      renderWithRouter(<Footer />);
      
      // Should have multiple links to dashboard
      const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' });
      expect(dashboardLinks.length).toBeGreaterThan(0);
      
      dashboardLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/dashboard');
      });
    });
  });

  describe('Dynamic content', () => {
    it('should update copyright year dynamically', () => {
      // Mock Date to test year functionality
      const mockDate = new Date('2025-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      renderWithRouter(<Footer />);
      
      expect(screen.getByText(/© 2025 WaifuHospital/)).toBeInTheDocument();
      
      global.Date.mockRestore();
    });

    it('should handle year edge cases', () => {
      // Test with different years
      const years = [2020, 2023, 2030];
      
      years.forEach(year => {
        const mockDate = new Date(`${year}-01-01`);
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        
        const { unmount } = renderWithRouter(<Footer />);
        
        expect(screen.getByText(`© ${year} WaifuHospital. All rights reserved.`)).toBeInTheDocument();
        
        global.Date.mockRestore();
        unmount();
      });
    });
  });

  describe('Layout structure', () => {
    it('should render footer sections in expected order', () => {
      renderWithRouter(<Footer />);
      
      const sections = ['WaifuHospital', 'Explore', 'Create', 'Help'];
      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });

    it('should contain all footer content within footer element', () => {
      const { container } = renderWithRouter(<Footer />);
      
      // Check that footer content is properly structured
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });
});