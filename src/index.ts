import {
  ActionImplementations,
  matchFactory,
  ProtocolConfig,
  NullEvent,
  EventUnionFromStateProtocolNode,
  AddNullTransition,
  Lookup,
} from './types';

// Pedestrian Protocol

interface PedestrianTimerEvent {
  type: 'PED_TIMER';
}

interface PedestrianProtocol {
  states: {
    WAIT: {
      context: { value: 'RED.WAIT' };
      transitions: [{ to: 'STOP'; event: PedestrianTimerEvent }];
    };
    WALK: {
      context: { value: 'RED.WALK' };
      transitions: [{ to: 'WAIT'; event: PedestrianTimerEvent }];
      states: NestedState;
    };
    STOP: {
      context: { value: 'RED.STOP' };
      transitions: [];
    };
  };
}

interface NestedState {
  states: {
    JOG: {
      context: {};
      transitions: [];
    };
    SPRINT: {
      context: {};
      transitions: [];
    };
    DO_THE_WORM: {
      context: {};
      transitions: [];
    };
  };
}

// Light Protocol

interface TimerEvent {
  type: 'TIMER';
}

interface PowerOutageEvent {
  type: 'POWER_OUTAGE';
}

interface LightProtocol {
  states: {
    GREEN: {
      context: { value: 'GREEN' };
      transitions: [
        { to: 'YELLOW'; event: TimerEvent },
        { to: 'RED'; event: PowerOutageEvent }
      ];
    };
    YELLOW: {
      context: { value: 'YELLOW' };
      transitions: [
        { to: 'RED'; event: TimerEvent },
        { to: 'RED'; event: PowerOutageEvent }
      ];
    };
    RED: {
      context: { value: 'RED.WALK' };
      transitions: [
        { to: 'GREEN'; event: TimerEvent },
        { to: 'RED'; event: PowerOutageEvent }
      ];
      states: PedestrianProtocol;
    };
  };
}
type D = LightProtocol['states']['RED']['states']['states']['WALK']['states']['states'];

// Light Configuration
const lightConfig: ProtocolConfig<LightProtocol, 'RED', ''> = {
  initial: 'RED',
  context: { value: 'RED.WALK' },
  states: {
    GREEN: {
      on: {
        TIMER: {
          target: 'YELLOW',
          actions: [
            (_ctx, _event) => {
              return { value: 'YELLOW' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: 'RED',
          actions: [
            (_ctx, _event) => {
              return { value: 'RED.WALK' };
            },
          ],
        },
      },
    },
    RED: {
      on: {
        TIMER: {
          target: 'GREEN',
          actions: [
            (_ctx, _event) => {
              return { value: 'GREEN' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: 'RED',
          actions: [
            (_ctx, _event) => {
              return _ctx;
            },
          ],
        },
      },
      states: {
        initial: 'WALK',
        STOP: {
          on: {},
        },
        WAIT: {
          on: {
            PED_TIMER: {
              target: 'STOP',
              actions: [
                (_ctx, _event) => {
                  return { value: 'RED.STOP' };
                },
              ],
            },
          },
        },
        WALK: {
          on: {
            PED_TIMER: {
              target: 'WAIT',
              actions: [
                (_ctx, _event) => {
                  return { value: 'RED.WAIT' };
                },
              ],
            },
          },
        },
      },
    },
    YELLOW: {
      on: {
        TIMER: {
          target: 'RED',
          actions: [
            (_ctx, _event) => {
              return { value: 'RED.WALK' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: 'RED',
          actions: [
            (_ctx, _event) => {
              return { value: 'RED.WALK' };
            },
          ],
        },
      },
    },
  },
};

enum AuthStates {
  LOGGED_IN = 'LOGGED_IN',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  LOGGED_OUT = 'LOGGED_OUT',
}

enum AuthEventTypes {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',

  // internal events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_ERROR = 'LOGIN_ERRROR',
}

interface LoginEvent {
  type: AuthEventTypes.LOGIN;
  payload: {
    username: string;
    password: string;
  };
}

interface LogoutEvent {
  type: AuthEventTypes.LOGOUT;
}

interface LoginSuccessEvent {
  type: AuthEventTypes.LOGIN_SUCCESS;
  payload: {
    user: {
      username: string;
    };
  };
}

interface LoginErrorEvent {
  type: AuthEventTypes.LOGIN_ERROR;
  payload: {
    error: string;
  };
}

interface AuthProtocol {
  states: {
    [AuthStates.LOGGED_OUT]: {
      context: { user: null; error: null };
      transitions: [{ to: AuthStates.LOADING; event: LoginEvent }];
    };
    [AuthStates.LOGGED_IN]: {
      context: { user: { username: string }; error: null };
      transitions: [{ to: AuthStates.LOGGED_OUT; event: LogoutEvent }];
    };
    [AuthStates.LOADING]: {
      context: { user: null; error: null };
      transitions: [
        { to: AuthStates.LOGGED_IN; event: LoginSuccessEvent },
        { to: AuthStates.ERROR; event: LoginErrorEvent }
      ];
    };
    [AuthStates.ERROR]: {
      context: { user: null; error: string };
      transitions: [{ to: AuthStates.LOADING; event: LoginEvent }];
    };
  };
}

enum EffectActions {
  TELEMETRY = 'TELEMETRY',
  NOTIFY_LOGGED_IN = 'NOTIFY_LOGGED_IN',
}

const authConfig: ProtocolConfig<AuthProtocol, AuthStates.LOGGED_OUT, EffectActions> = {
  initial: AuthStates.LOGGED_OUT,
  context: {
    error: null,
    user: null,
  },
  states: {
    [AuthStates.LOGGED_OUT]: {
      on: {
        LOGIN: [
          {
            target: AuthStates.LOADING,
            actions: [
              (_ctx, _event) => {
                return { error: null, user: null };
              },
            ],
          },
        ],
      },
    },
    [AuthStates.LOADING]: {
      on: {
        LOGIN_ERRROR: {
          target: AuthStates.ERROR,
          actions: [
            (_ctx, event) => {
              return { error: event.payload.error, user: null };
            },
            EffectActions.TELEMETRY,
          ],
        },
        LOGIN_SUCCESS: {
          target: AuthStates.LOGGED_IN,
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
              type: AuthEventTypes.LOGIN_SUCCESS,
              payload: {
                user: {
                  username: 'bob27',
                },
              },
            }
          : {
              type: AuthEventTypes.LOGIN_ERROR,
              payload: {
                error: 'LOGIN_ERROR',
              },
            };
      },
    },
    [AuthStates.ERROR]: {
      on: {
        LOGIN: {
          target: AuthStates.LOADING,
          actions: [
            (_ctx, event) => {
              return { error: null, user: null };
            },
          ],
        },
      },
    },
    [AuthStates.LOGGED_IN]: {
      on: {
        LOGOUT: {
          target: AuthStates.LOGGED_OUT,
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
    if (event.type === AuthEventTypes.LOGIN) {
      // event payload correctly narrowed
      const { username, password } = event.payload;
    }
    if (_ctx.user && _ctx.user.username) {
      const e = event.type;
    }
  },
  NOTIFY_LOGGED_IN: (_ctx, event) => {
    if (event.type === AuthEventTypes.LOGIN_SUCCESS) {
      console.log(event.payload.user);
    }
  },
};

/*
const doorMachine = Machine(
  {
    id: 'door',
    initial: 'closed',
    context: {
      level: 'admin',
      alert: false // alert when intrusions happen
    },
    states: {
      closed: {
        initial: 'idle',
        states: {
          idle: {},
          error: {}
        },
        on: {
          SET_ADMIN: {
            actions: assign({ level: 'admin' })
          },
          OPEN: [
            // Transitions are tested one at a time.
            // The first valid transition will be taken.
            { target: 'opened', cond: 'isAdmin' },
            { target: '.error', cond: 'shouldAlert' },
            { target: '.idle' }
          ]
        }
      },
      opened: {
        on: {
          CLOSE: 'closed'
        }
      }
    }
  },
);
*/
