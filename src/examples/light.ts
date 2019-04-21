import {
  ProtocolConfig,
  StateProtocol,
  StateNode,
  Lookup,
  EventUnionFromStateProtocolNode,
  TransitionUnionFromStateProtocolNode,
  ContextMapFromStateProtocol,
  Transition,
  createStateFromConfig,
} from '../types';

// Pedestrian Protocol
interface PedestrianTimerEvent {
  type: 'PED_TIMER';
}

interface PedestrianProtocol {
  states: {
    WAIT: {
      context: { value: 'RED.WAIT' };
      transitions: [Transition<PedestrianTimerEvent, 'STOP'>];
    };
    WALK: {
      context: { value: 'RED.WALK' };
      transitions: [Transition<PedestrianTimerEvent, 'WAIT'>];
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
      transitions: [Transition<{ type: 'SLOW_DOWN' }, 'JOG'>];
      states: HumanStatus;
    };
    DO_THE_WORM: {
      context: {};
      transitions: [];
    };
  };
}

interface HumanStatus {
  states: {
    DEAD: {
      context: {};
      transitions: [Transition<{ type: 'RESURRECT' }, 'ALIVE'>];
    };
    ALIVE: {
      context: {};
      transitions: [Transition<{ type: 'DIE' }, 'DEAD'>];
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
        Transition<TimerEvent, 'YELLOW'>,
        Transition<PowerOutageEvent, 'RED'>
      ];
    };
    YELLOW: {
      context: { value: 'YELLOW' };
      transitions: [Transition<TimerEvent, 'RED'>, Transition<PowerOutageEvent, 'RED'>];
    };
    RED: {
      context: { value: 'RED.WALK' };
      transitions: [Transition<TimerEvent, 'GREEN'>, Transition<PowerOutageEvent, 'RED'>];
      states: PedestrianProtocol;
    };
  };
}

type EventsFromProtocol<T> = T extends StateProtocol<any>
  ? { [K in keyof T['states']]: EventFromNode<T['states'][K]> }[keyof T['states']]
  : never;

type EventFromNode<T> = T extends StateNode<any, infer Events>
  ?
      | Events
      | {
          [K in keyof Lookup<T['states'], 'states'>]: EventFromNode<
            Lookup<Lookup<T['states'], 'states'>, K>
          >
        }[keyof Lookup<T['states'], 'states'>]
  : never;

type Z = EventsFromProtocol<LightProtocol>;

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

const initialState = createStateFromConfig(lightConfig);
const greenState = initialState.transition({ type: 'TIMER' });
const powerOutState = greenState.transition({ type: 'POWER_OUTAGE' });
const powerOnState = powerOutState.transition({ type: 'TIMER' });
const current = powerOnState.transition({ type: 'TIMER' });
