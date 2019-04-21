import { ProtocolConfig, ActionImplementations } from '../types';

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
      transitions: [{ to: 'LOADING'; event: LoginEvent }];
    };
    LOGGED_IN: {
      context: { user: { username: string }; error: null };
      transitions: [{ to: 'LOGGED_OUT'; event: LogoutEvent }];
    };
    LOADING: {
      context: { user: null; error: null };
      transitions: [
        { to: 'LOGGED_IN'; event: LoginSuccessEvent },
        { to: 'ERROR'; event: LoginErrorEvent }
      ];
    };
    ERROR: {
      context: { user: null; error: string };
      transitions: [{ to: 'LOADING'; event: LoginEvent }];
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
      invoke: (_ctx, _event) => {
        const seed = Math.random();
        return seed > 0.5
          ? {
              type: 'LOGIN_SUCCESS',
              payload: {
                user: {
                  username: 'bob27',
                },
              },
            }
          : {
              type: 'LOGIN_ERROR',
              payload: {
                error: 'LOGIN_ERROR',
              },
            };
      },
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