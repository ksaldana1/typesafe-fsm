import { of } from 'rxjs';
import {
  ActionImplementations,
  createStateFromConfig,
  ProtocolConfig,
  Transition,
} from '../types';

interface LoginEvent {
  type: 'LOGIN';
  payload: {
    username: string;
    password: string;
  };
}

interface LogoutEvent {
  type: 'LOGOUT';
}

interface LoginSuccessEvent {
  type: 'LOGIN_SUCCESS';
  payload: {
    user: {
      username: string;
    };
  };
}

interface LoginErrorEvent {
  type: 'LOGIN_ERROR';
  payload: {
    error: string;
  };
}

interface AuthProtocol {
  states: {
    LOGGED_OUT: {
      context: { user: null; error: null };
      transitions: [Transition<LoginEvent, 'LOADING'>];
    };
    LOGGED_IN: {
      context: { user: { username: string }; error: null };
      transitions: [Transition<LogoutEvent, 'LOGGED_OUT'>];
    };
    LOADING: {
      context: { user: null; error: null };
      transitions: [
        Transition<LoginSuccessEvent, 'LOGGED_IN'>,
        Transition<LoginErrorEvent, 'ERROR'>
      ];
    };
    ERROR: {
      context: { user: null; error: string };
      transitions: [Transition<LoginEvent, 'LOADING'>];
    };
  };
}

enum EffectActions {
  TELEMETRY = 'TELEMETRY',
  NOTIFY_LOGGED_IN = 'NOTIFY_LOGGED_IN',
}

const authConfig: ProtocolConfig<AuthProtocol, 'LOGGED_OUT', EffectActions> = {
  initial: 'LOGGED_OUT',
  context: {
    error: null,
    user: null,
  },
  states: {
    LOGGED_OUT: {
      on: {
        LOGIN: [
          {
            target: 'LOADING',
            actions: [
              (_ctx, _event) => {
                return { error: null, user: null };
              },
            ],
          },
        ],
      },
    },
    LOADING: {
      on: {
        LOGIN_ERROR: {
          target: 'ERROR',
          actions: [
            (_ctx, event) => {
              return { error: event.payload.error, user: null };
            },
            EffectActions.TELEMETRY,
          ],
        },
        LOGIN_SUCCESS: {
          target: 'LOGGED_IN',
          actions: [
            (_ctx, event) => {
              return { error: null, user: event.payload.user };
            },
            EffectActions.NOTIFY_LOGGED_IN,
          ],
        },
      },
      invoke: (_ctx, event) =>
        of(
          Math.random() > 0.5
            ? {
                type: 'LOGIN_SUCCESS',
                payload: {
                  user: {
                    username: event.payload.username,
                  },
                },
              }
            : {
                type: 'LOGIN_ERROR',
                payload: {
                  error: 'LOGIN_ERROR',
                },
              }
        ),
    },
    ERROR: {
      on: {
        LOGIN: {
          target: 'LOADING',
          actions: [
            (_ctx, event) => {
              return { error: null, user: null };
            },
          ],
        },
      },
    },
    LOGGED_IN: {
      on: {
        LOGOUT: {
          target: 'LOGGED_OUT',
          actions: [
            (_ctx, _event) => {
              return { error: null, user: null };
            },
          ],
        },
      },
    },
  },
};

const actionImpls: ActionImplementations<typeof authConfig> = {
  TELEMETRY: (_ctx, event) => {
    if (event.type === 'LOGIN') {
      // event payload correctly narrowed
      const { username, password } = event.payload;
    }
    if (_ctx.user && _ctx.user.username) {
      const e = event.type;
    }
  },
  NOTIFY_LOGGED_IN: (_ctx, event) => {
    if (event.type === 'LOGIN_SUCCESS') {
      console.log(event.payload.user);
    }
  },
};

const initialState = createStateFromConfig(authConfig);
const currentContext = initialState.context; // context is {error: null, user: null}
const currentValue = initialState.value; // value is "LOGGED_OUT"

const loadingState = initialState.transition({
  type: 'LOGIN',
  payload: {
    username: 'bob',
    password: '12345',
  },
});
const loadingContext = loadingState.context; // context is {error: null, user: null}
const loadingValue = loadingState.value; // value is "LOADING"

const logoutInvalidTransition = loadingState.transition({
  type: 'LOGOUT', // ERROR: Type '"LOGOUT"' is not assignable to type '"LOGIN_SUCCESS" | "LOGIN_ERROR"'
});

const errorState = loadingState.transition({
  type: 'LOGIN_ERROR',
  payload: { error: 'ERROR' },
});
const errorContext = errorState.context; // context is {error: string, user: null}
const errorValue = errorState.value; // value is ERROR

const successState = loadingState.transition({
  type: 'LOGIN_SUCCESS',
  payload: { user: { username: 'bob' } },
});
const successContext = successState.context; // context is {error: null, user: {username: string}}
const successValue = successState.value; // value is LOGGED_IN
