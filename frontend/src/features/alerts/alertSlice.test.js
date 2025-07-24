import alertsReducer, { setAlert, removeAlert } from './alertSlice';

// Mock uuid v4 function specifically
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

describe('alertSlice', () => {
  describe('initial state', () => {
    it('should handle initial state', () => {
      const initialState = alertsReducer(undefined, { type: 'unknown' });
      expect(initialState).toEqual([]);
    });
  });

  describe('setAlert action', () => {
    it('should add an alert with all properties', () => {
      const alertData = {
        msg: 'Test message',
        type: 'success',
        timeout: 3000,
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state).toHaveLength(1);
      expect(state[0]).toEqual({
        id: 'test-uuid-123',
        msg: 'Test message',
        type: 'success',
        timeout: 3000,
      });
    });

    it('should add an alert with default timeout', () => {
      const alertData = {
        msg: 'Test message',
        type: 'error',
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state).toHaveLength(1);
      expect(state[0]).toEqual({
        id: 'test-uuid-123',
        msg: 'Test message',
        type: 'error',
        timeout: 5000, // default timeout
      });
    });

    it('should add multiple alerts', () => {
      let state = [];

      // Add first alert
      const firstAlert = setAlert({ msg: 'First alert', type: 'info' });
      state = alertsReducer(state, firstAlert);

      // Add second alert  
      const secondAlert = setAlert({ msg: 'Second alert', type: 'warning' });
      state = alertsReducer(state, secondAlert);

      expect(state).toHaveLength(2);
      expect(state[0].msg).toBe('First alert');
      expect(state[1].msg).toBe('Second alert');
    });

    it('should handle different alert types', () => {
      const alertTypes = ['success', 'error', 'warning', 'info'];
      let state = [];

      alertTypes.forEach((type) => {
        const action = setAlert({ msg: `${type} message`, type });
        state = alertsReducer(state, action);
      });

      expect(state).toHaveLength(4);
      alertTypes.forEach((type, index) => {
        expect(state[index].type).toBe(type);
        expect(state[index].msg).toBe(`${type} message`);
      });
    });
  });

  describe('removeAlert action', () => {
    it('should remove an alert by id', () => {
      const initialState = [
        {
          id: 'alert-1',
          msg: 'First alert',
          type: 'success',
          timeout: 5000,
        },
        {
          id: 'alert-2',
          msg: 'Second alert',
          type: 'error',
          timeout: 5000,
        },
        {
          id: 'alert-3',
          msg: 'Third alert',
          type: 'info',
          timeout: 5000,
        },
      ];

      const action = removeAlert('alert-2');
      const state = alertsReducer(initialState, action);

      expect(state).toHaveLength(2);
      expect(state.find(alert => alert.id === 'alert-2')).toBeUndefined();
      expect(state.find(alert => alert.id === 'alert-1')).toBeDefined();
      expect(state.find(alert => alert.id === 'alert-3')).toBeDefined();
    });

    it('should not modify state if alert id does not exist', () => {
      const initialState = [
        {
          id: 'alert-1',
          msg: 'First alert',
          type: 'success',
          timeout: 5000,
        },
      ];

      const action = removeAlert('non-existent-id');
      const state = alertsReducer(initialState, action);

      expect(state).toHaveLength(1);
      expect(state[0].id).toBe('alert-1');
    });

    it('should handle removing from empty state', () => {
      const action = removeAlert('any-id');
      const state = alertsReducer([], action);

      expect(state).toEqual([]);
    });

    it('should remove all alerts when called multiple times', () => {
      const initialState = [
        { id: 'alert-1', msg: 'Alert 1', type: 'success', timeout: 5000 },
        { id: 'alert-2', msg: 'Alert 2', type: 'error', timeout: 5000 },
      ];

      let state = initialState;
      state = alertsReducer(state, removeAlert('alert-1'));
      state = alertsReducer(state, removeAlert('alert-2'));

      expect(state).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle setAlert with minimal properties', () => {
      const alertData = {
        msg: 'Minimal alert',
        type: 'success',
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state[0]).toHaveProperty('id');
      expect(state[0]).toHaveProperty('msg');
      expect(state[0]).toHaveProperty('type');
      expect(state[0]).toHaveProperty('timeout');
    });

    it('should handle setAlert with zero timeout', () => {
      const alertData = {
        msg: 'Zero timeout alert',
        type: 'info',
        timeout: 0,
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state[0].timeout).toBe(0);
    });

    it('should handle setAlert with very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const alertData = {
        msg: longMessage,
        type: 'warning',
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state[0].msg).toBe(longMessage);
      expect(state[0].msg).toHaveLength(1000);
    });

    it('should handle setAlert with special characters in message', () => {
      const specialMessage = 'Alert with 特殊字符 and émojis 🎉 and <script>alert("xss")</script>';
      const alertData = {
        msg: specialMessage,
        type: 'error',
      };

      const action = setAlert(alertData);
      const state = alertsReducer([], action);

      expect(state[0].msg).toBe(specialMessage);
    });

    it('should maintain alert order when adding multiple alerts', () => {
      let state = [];
      const messages = ['First', 'Second', 'Third', 'Fourth'];

      messages.forEach((msg) => {
        const action = setAlert({ msg, type: 'info' });
        state = alertsReducer(state, action);
      });

      expect(state).toHaveLength(4);
      messages.forEach((msg, index) => {
        expect(state[index].msg).toBe(msg);
      });
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state when adding alert', () => {
      const originalState = [
        { id: 'existing', msg: 'Existing alert', type: 'info', timeout: 5000 }
      ];
      const frozenState = Object.freeze([...originalState]);

      const action = setAlert({ msg: 'New alert', type: 'success' });
      const newState = alertsReducer(frozenState, action);

      expect(newState).not.toBe(frozenState);
      expect(newState).toHaveLength(2);
      expect(frozenState).toHaveLength(1);
    });

    it('should not mutate original state when removing alert', () => {
      const originalState = [
        { id: 'alert-1', msg: 'Alert 1', type: 'info', timeout: 5000 },
        { id: 'alert-2', msg: 'Alert 2', type: 'info', timeout: 5000 }
      ];
      const frozenState = Object.freeze([...originalState]);

      const action = removeAlert('alert-1');
      const newState = alertsReducer(frozenState, action);

      expect(newState).not.toBe(frozenState);
      expect(newState).toHaveLength(1);
      expect(frozenState).toHaveLength(2);
    });
  });
});