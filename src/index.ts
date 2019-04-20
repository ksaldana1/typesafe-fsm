import { ActionImplementations, matchFactory, ProtocolConfig } from './types';

// Pedestrian Protocol
enum PedestrianStates {
  WALK = 'WALK',
  WAIT = 'WAIT',
  STOP = 'STOP',
}

enum PedestrianEventTypes {
  PED_TIMER = 'PED_TIMER',
}

interface PedestrianTimerEvent {
  type: PedestrianEventTypes.PED_TIMER;
}

interface PedestrianProtocol {
  states: {
    [PedestrianStates.WAIT]: {
      context: { value: 'RED.WAIT' };
      transitions: [{ to: PedestrianStates.STOP; event: PedestrianTimerEvent }];
    };
    [PedestrianStates.WALK]: {
      context: { value: 'RED.WALK' };
      transitions: [{ to: PedestrianStates.WAIT; event: PedestrianTimerEvent }];
    };
    [PedestrianStates.STOP]: {
      context: { value: 'RED.STOP' };
      transitions: [];
    };
  };
}

// Light Protocol
enum LightStates {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

enum LightEventTypes {
  TIMER = 'TIMER',
  POWER_OUTAGE = 'POWER_OUTAGE',
}

interface TimerEvent {
  type: LightEventTypes.TIMER;
}

interface PowerOutageEvent {
  type: LightEventTypes.POWER_OUTAGE;
}

interface LightProtocol {
  states: {
    [LightStates.GREEN]: {
      context: { value: 'GREEN' };
      transitions: [
        { to: LightStates.YELLOW; event: TimerEvent },
        { to: LightStates.RED; event: PowerOutageEvent }
      ];
    };
    [LightStates.YELLOW]: {
      context: { value: 'YELLOW' };
      transitions: [
        { to: LightStates.RED; event: TimerEvent },
        { to: LightStates.RED; event: PowerOutageEvent }
      ];
    };
    [LightStates.RED]: {
      context: { value: 'RED.WALK' };
      transitions: [
        { to: LightStates.GREEN; event: TimerEvent },
        { to: LightStates.RED; event: PowerOutageEvent }
      ];
      states: PedestrianProtocol;
    };
  };
}

// Light Configuration
const lightConfig: ProtocolConfig<LightProtocol, LightStates.RED, ''> = {
  initial: LightStates.RED,
  context: { value: 'RED.WALK' },
  states: {
    GREEN: {
      on: {
        TIMER: {
          target: LightStates.YELLOW,
          actions: [
            (_ctx, _event) => {
              return { value: 'YELLOW' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: LightStates.RED,
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
          target: LightStates.GREEN,
          actions: [
            (_ctx, _event) => {
              return { value: 'GREEN' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: LightStates.RED,
          actions: [
            (_ctx, _event) => {
              return _ctx;
            },
          ],
        },
      },
      states: {
        initial: PedestrianStates.WALK,
        STOP: {
          on: {},
        },
        WAIT: {
          on: {
            PED_TIMER: {
              target: PedestrianStates.STOP,
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
              target: PedestrianStates.WAIT,
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
          target: LightStates.RED,
          actions: [
            (_ctx, _event) => {
              return { value: 'RED.WALK' };
            },
          ],
        },
        POWER_OUTAGE: {
          target: LightStates.RED,
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

const lightMatch = matchFactory<LightProtocol>();

const valid1 = lightMatch(LightStates.GREEN);
const valid2 = lightMatch(LightStates.RED);
const valid3 = lightMatch(LightStates.RED, PedestrianStates.WALK);

<<<<<<< HEAD
// const invalid1 = lightMatch('invalid');
// const invalid2 = lightMatch(LightStates.YELLOW, PedestrianStates.WAIT);
// const invalid3 = lightMatch(
//   LightStates.RED,
//   PedestrianStates.WAIT,
//   PedestrianStates.WALK
// );
=======
const invalid1 = lightMatch('invalid');
const invalid2 = lightMatch(LightStates.YELLOW, PedestrianStates.WALK);
const invalid3 = lightMatch(
  LightStates.RED,
  PedestrianStates.WAIT,
  PedestrianStates.WALK
);
>>>>>>> 63baf53c0712ac5c1a2cab9e9d2425b2a758b5d7

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
