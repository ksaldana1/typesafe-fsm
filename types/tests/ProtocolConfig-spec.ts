import { AuthProtocol } from '../../src/examples/auth';
import { ProtocolConfig } from '../../src/types';

const protocol: ProtocolConfig<AuthProtocol, 'LOGGED_OUT', ''> = {
  initial: 'LOGGED_OUT', // $ExpecType "LOGGED_OUT"
  context: {
    error: null, // $ExpectType null
    user: null, // $ExpectType null
  },
  states: {
    LOGGED_OUT: {
      on: {
        LOGIN: [
          {
            target: 'LOADING',
            actions: (_ctx, _event) => {
              const ctx = _ctx; // $ExpectType { user: null; error: null; }
              const e = _event; // $ExpectType LoginEvent
              return { error: null, user: null };
            },
          },
        ],
      },
    },
    LOADING: {
      // $ExpectError
      on: {
        LOGIN_ERROR: {
          target: 'ERROR', // $ExpectType "ERROR"
          actions: (_ctx, event) => {
            const ctx = _ctx; // $ExpectType { user: null; error: null; }
            const e = event; // $ExpectType LoginErrorEvent
            return { error: event.payload.error, user: null };
          },
        },
        LOGIN_SUCCESS: {
          target: 'LOGGED_IN', // $ExpectType "LOGGED_IN"
          actions: (_ctx, event) => {
            const ctx = _ctx; // $ExpectType { user: null; error: null; }
            const e = event; // $ExpectType LoginSuccessEvent
            return { error: 'wrong', user: event.payload.user }; // error should be null
          },
        },
      },
    },
    ERROR: {
      on: {
        LOGIN: {
          target: 'LOADING', // $ExpectType "LOADING"
          actions: [
            (_ctx, event) => {
              const ctx = _ctx; // $ExpectType { error: string; user: null; }
              return { error: null, user: null };
            },
          ],
        },
      },
    },
    LOGGED_IN: {
      // $ExpectError
      on: {
        // Property LOGOUT missing
      },
    },
  },
};
