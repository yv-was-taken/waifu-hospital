import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Alert from './Alert';
import alertsReducer from '../../features/alerts/alertSlice';

// Mock styled-components
jest.mock('styled-components', () => ({
  __esModule: true,
  default: (component) => (props) => React.createElement(component, props),
}));

const createMockStore = (initialAlerts = []) => {
  return configureStore({
    reducer: {
      alert: alertsReducer,
    },
    preloadedState: {
      alert: initialAlerts,
    },
  });
};

const renderWithStore = (component, store) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('Alert Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render without alerts', () => {
    const store = createMockStore([]);
    renderWithStore(<Alert />, store);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render single alert', () => {
    const alerts = [
      {
        id: '1',
        msg: 'Test alert message',
        type: 'success',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Test alert message')).toBeInTheDocument();
  });

  it('should render multiple alerts', () => {
    const alerts = [
      {
        id: '1',
        msg: 'First alert',
        type: 'success',
        timeout: 5000,
      },
      {
        id: '2',
        msg: 'Second alert',
        type: 'error',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('First alert')).toBeInTheDocument();
    expect(screen.getByText('Second alert')).toBeInTheDocument();
  });

  it('should handle different alert types', () => {
    const alertTypes = ['success', 'error', 'warning', 'info'];
    
    alertTypes.forEach((type, index) => {
      const alerts = [
        {
          id: `${index}`,
          msg: `${type} alert`,
          type,
          timeout: 5000,
        },
      ];
      
      const store = createMockStore(alerts);
      const { unmount } = renderWithStore(<Alert />, store);
      
      expect(screen.getByText(`${type} alert`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle unknown alert type', () => {
    const alerts = [
      {
        id: '1',
        msg: 'Unknown type alert',
        type: 'unknown',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Unknown type alert')).toBeInTheDocument();
  });

  it('should remove alert when close button is clicked', async () => {
    const alerts = [
      {
        id: '1',
        msg: 'Test alert',
        type: 'success',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Test alert')).toBeInTheDocument();
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test alert')).not.toBeInTheDocument();
    });
  });

  it('should auto-remove alerts after timeout', async () => {
    const alerts = [
      {
        id: '1',
        msg: 'Auto remove alert',
        type: 'success',
        timeout: 1000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Auto remove alert')).toBeInTheDocument();
    
    // Fast-forward time past the timeout
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.queryByText('Auto remove alert')).not.toBeInTheDocument();
    });
  });

  it('should handle multiple alerts with different timeouts', async () => {
    const alerts = [
      {
        id: '1',
        msg: 'Quick alert',
        type: 'success',
        timeout: 1000,
      },
      {
        id: '2',
        msg: 'Slow alert',
        type: 'info',
        timeout: 3000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Quick alert')).toBeInTheDocument();
    expect(screen.getByText('Slow alert')).toBeInTheDocument();
    
    // Fast-forward past first timeout
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.queryByText('Quick alert')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Slow alert')).toBeInTheDocument();
    
    // Fast-forward past second timeout
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.queryByText('Slow alert')).not.toBeInTheDocument();
    });
  });

  it('should handle empty alert message', () => {
    const alerts = [
      {
        id: '1',
        msg: '',
        type: 'success',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    // Should still render the alert container even with empty message
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should handle alerts without timeout', () => {
    const alerts = [
      {
        id: '1',
        msg: 'No timeout alert',
        type: 'success',
        // No timeout property
      },
    ];
    
    const store = createMockStore(alerts);
    renderWithStore(<Alert />, store);
    
    expect(screen.getByText('No timeout alert')).toBeInTheDocument();
  });

  it('should clean up timers on unmount', () => {
    const alerts = [
      {
        id: '1',
        msg: 'Timer cleanup test',
        type: 'success',
        timeout: 5000,
      },
    ];
    
    const store = createMockStore(alerts);
    const { unmount } = renderWithStore(<Alert />, store);
    
    expect(screen.getByText('Timer cleanup test')).toBeInTheDocument();
    
    // Unmount before timeout
    unmount();
    
    // Advance timers - should not cause any issues
    jest.advanceTimersByTime(5000);
  });

  it('should handle alert state updates', async () => {
    const store = createMockStore([]);
    renderWithStore(<Alert />, store);
    
    // Initially no alerts
    expect(screen.queryByText('New alert')).not.toBeInTheDocument();
    
    // Add an alert to the store
    store.dispatch({
      type: 'alert/addAlert',
      payload: {
        id: '1',
        msg: 'New alert',
        type: 'success',
        timeout: 5000,
      },
    });
    
    await waitFor(() => {
      expect(screen.getByText('New alert')).toBeInTheDocument();
    });
  });
});