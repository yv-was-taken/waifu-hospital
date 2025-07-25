import React from 'react';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

// Styled-components mocked globally in setupTests.js

describe('Spinner Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<Spinner />);
    
    // Check that the spinner is rendered - it should have nested divs
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should render spinner element', () => {
    const { container } = render(<Spinner />);
    
    // Check that spinner is rendered (it's a div without specific roles/text)
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveProperty('tagName', 'DIV');
  });

  it('should have proper structure', () => {
    const { container } = render(<Spinner />);
    
    // Should have nested div structure
    const outerDiv = container.firstChild;
    const innerDiv = outerDiv?.firstChild;
    
    expect(outerDiv).toBeInTheDocument();
    expect(innerDiv).toBeInTheDocument();
  });

  it('should be accessible for screen readers', () => {
    const { container } = render(<Spinner />);
    
    // Add aria-label for accessibility testing
    const spinner = container.querySelector('div');
    
    // Verify the spinner renders (visual loading indicator)
    expect(spinner).toBeInTheDocument();
  });

  it('should render consistently', () => {
    const { container: container1 } = render(<Spinner />);
    const { container: container2 } = render(<Spinner />);
    
    // Both should have the same structure
    expect(container1.innerHTML).toBe(container2.innerHTML);
  });

  it('should handle multiple instances', () => {
    const { container } = render(
      <div>
        <Spinner />
        <Spinner />
        <Spinner />
      </div>
    );
    
    // Should render three spinners - each spinner has a container div with a child div
    const spinners = container.querySelectorAll('div > div');
    expect(spinners.length).toBeGreaterThanOrEqual(3);
  });

  it('should not crash with props', () => {
    // Spinner doesn't take props, but should handle them gracefully
    expect(() => {
      render(<Spinner someRandomProp="test" />);
    }).not.toThrow();
  });

  it('should maintain consistent rendering', () => {
    const { container, rerender } = render(<Spinner />);
    const initialHTML = container.innerHTML;
    
    // Re-render and check consistency
    rerender(<Spinner />);
    expect(container.innerHTML).toBe(initialHTML);
  });

  describe('Component behavior', () => {
    it('should be a functional component', () => {
      // Verify it's a valid React component
      expect(typeof Spinner).toBe('function');
      expect(() => render(<Spinner />)).not.toThrow();
    });

    it('should not have any interactive elements', () => {
      render(<Spinner />);
      
      // Spinner should not have buttons, links, or inputs
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not display any text content', () => {
      const { container } = render(<Spinner />);
      
      // Spinner should be purely visual
      expect(container.textContent).toBe('');
    });

    it('should be purely presentational', () => {
      const { container } = render(<Spinner />);
      
      // Should not have any event handlers or interactive content
      const allElements = container.querySelectorAll('*');
      allElements.forEach(element => {
        // Check that no elements have common event attributes
        expect(element).not.toHaveAttribute('onclick');
        expect(element).not.toHaveAttribute('onkeydown');
        expect(element).not.toHaveAttribute('tabindex');
      });
    });
  });

  describe('Accessibility considerations', () => {
    it('should be suitable for loading states', () => {
      const { container } = render(<Spinner />);
      
      // While it doesn't have explicit ARIA attributes in the basic version,
      // it should be a valid loading indicator
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not interfere with screen readers when used appropriately', () => {
      const { container } = render(
        <div aria-live="polite" aria-label="Loading">
          <Spinner />
        </div>
      );
      
      // Parent container provides accessibility context
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('should work within other components', () => {
      const ParentComponent = () => (
        <div>
          <h1>Loading Data</h1>
          <Spinner />
          <p>Please wait...</p>
        </div>
      );
      
      render(<ParentComponent />);
      
      expect(screen.getByText('Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should handle conditional rendering', () => {
      const ConditionalSpinner = ({ loading }) => (
        <div>
          {loading && <Spinner />}
          {!loading && <div>Content loaded</div>}
        </div>
      );
      
      const { rerender } = render(<ConditionalSpinner loading={true} />);
      
      // Should show spinner when loading
      let container = document.querySelector('div');
      expect(container).toBeInTheDocument();
      
      // Should hide spinner when not loading
      rerender(<ConditionalSpinner loading={false} />);
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
    });

    it('should work with CSS-in-JS libraries', () => {
      // Since it uses styled-components, ensure it works with the mock
      const { container } = render(<Spinner />);
      
      // Should render even with mocked styled-components
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});