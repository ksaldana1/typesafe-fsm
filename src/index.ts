import { Lookup, SchemaConfig, StateProtocol, matchFactory } from './types';

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
const config: SchemaConfig<LightProtocol, LightStates.RED> = {
  initial: LightStates.RED,
  context: { value: 'RED.WALK' },
  states: {
    GREEN: {
      on: {
        TIMER: (_ctx, _event) => {
          return { value: 'YELLOW' };
        },
      },
    },
    RED: {
      on: {
        TIMER: (_ctx, _event) => {
          return { value: 'GREEN' };
        },
      },
      states: {
        STOP: {
          on: {},
        },
        WAIT: {
          on: {
            PED_TIMER: (_ctx, _event) => {
              return { value: 'RED.STOP' };
            },
          },
        },
        WALK: {
          on: {
            PED_TIMER: (_ctx, _event) => {
              return { value: 'RED.WAIT' };
            },
          },
        },
      },
    },
    YELLOW: {
      on: {
        TIMER: (_ctx, _event) => {
          return { value: 'RED.WALK' };
        },
      },
    },
  },
};

const match = matchFactory<LightProtocol>();

const valid1 = match(LightStates.GREEN);
const valid2 = match(LightStates.RED);
const valid3 = match(LightStates.RED, PedestrianStates.WALK);

const invalid1 = match('invalid');
const invalid2 = match(LightStates.YELLOW, PedestrianStates.WAIT);
const invalid3 = match(LightStates.RED, PedestrianStates.WAIT, PedestrianStates.WALK);
