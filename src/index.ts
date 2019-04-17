import { matchFactory, ProtocolConfig } from './types';

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
    [PedestrianStates.WALK]: {
      context: { value: 'RED.WALK' };
      transitions: [{ to: PedestrianStates.WAIT; event: PedestrianTimerEvent }];
    };
    [PedestrianStates.WAIT]: {
      context: { value: 'RED.WAIT' };
      transitions: [{ to: PedestrianStates.STOP; event: PedestrianTimerEvent }];
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
}

interface TimerEvent {
  type: LightEventTypes.TIMER;
}

interface LightProtocol {
  states: {
    [LightStates.GREEN]: {
      context: { value: 'GREEN' };
      transitions: [{ to: LightStates.YELLOW; event: TimerEvent }];
    };
    [LightStates.YELLOW]: {
      context: { value: 'YELLOW' };
      transitions: [{ to: LightStates.RED; event: TimerEvent }];
    };
    [LightStates.RED]: {
      context: { value: 'RED.WALK' };
      transitions: [{ to: LightStates.GREEN; event: TimerEvent }];
      states: PedestrianProtocol;
    };
  };
}

// Light Configuration
const lightConfig: ProtocolConfig<LightProtocol, LightStates.RED> = {
  initial: LightStates.RED,
  context: { value: 'RED.WALK' },
  states: {
    GREEN: {
      on: {
        TIMER: {
          target: LightStates.YELLOW,
          action: (_ctx, _event) => {
            return { value: 'YELLOW' };
          },
        },
      },
    },
    RED: {
      on: {
        TIMER: {
          target: LightStates.GREEN,
          action: (_ctx, _event) => {
            return { value: 'GREEN' };
          },
        },
      },
      states: {
        STOP: {
          on: {},
        },
        WAIT: {
          on: {
            PED_TIMER: {
              target: PedestrianStates.STOP,
              action: (_ctx, _event) => {
                return { value: 'RED.STOP' };
              },
            },
          },
        },
        WALK: {
          on: {
            PED_TIMER: {
              target: PedestrianStates.WAIT,
              action: (_ctx, _event) => {
                return { value: 'RED.WAIT' };
              },
            },
          },
        },
      },
    },
    YELLOW: {
      on: {
        TIMER: {
          target: LightStates.RED,
          action: (_ctx, _event) => {
            return { value: 'RED.WALK' };
          },
        },
      },
    },
  },
};

const lightMatch = matchFactory<LightProtocol>();

const valid1 = lightMatch(LightStates.GREEN);
const valid2 = lightMatch(LightStates.RED);
const valid3 = lightMatch(LightStates.RED, PedestrianStates.WALK);

const invalid1 = lightMatch('invalid');
const invalid2 = lightMatch(LightStates.YELLOW, PedestrianStates.WAIT);
const invalid3 = lightMatch(
  LightStates.RED,
  PedestrianStates.WAIT,
  PedestrianStates.WALK
);

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

const authMatch = matchFactory<AuthProtocol>();

const authConfig: ProtocolConfig<AuthProtocol, AuthStates.LOGGED_OUT> = {
  initial: AuthStates.LOGGED_OUT,
  context: {
    error: null,
    user: null,
  },
  states: {
    [AuthStates.LOGGED_OUT]: {
      on: {
        LOGIN: {
          target: AuthStates.LOADING,
          action: (_ctx, _event) => {
            return { error: null, user: null };
          },
        },
      },
    },
    [AuthStates.LOADING]: {
      on: {
        LOGIN_ERRROR: {
          target: AuthStates.ERROR,
          action: (_ctx, event) => {
            return { error: event.payload.error, user: null };
          },
        },
        LOGIN_SUCCESS: {
          target: AuthStates.LOGGED_IN,
          action: (_ctx, event) => {
            return { error: null, user: event.payload.user };
          },
        },
      },
    },
    [AuthStates.ERROR]: {
      on: {
        LOGIN: {
          target: AuthStates.LOADING,
          action: (_ctx, event) => {
            return { error: null, user: null };
          },
        },
      },
    },
    [AuthStates.LOGGED_IN]: {
      on: {
        LOGOUT: {
          target: AuthStates.LOGGED_OUT,
          action: (_ctx, _event) => {
            return { error: null, user: null };
          },
        },
      },
    },
  },
};
