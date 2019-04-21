import {
  ProtocolConfig,
  StateProtocol,
  StateNode,
  Lookup,
  EventUnionFromStateProtocolNode,
  TransitionUnionFromStateProtocolNode,
  ContextMapFromStateProtocol,
} from '../types';

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
      transitions: [{ to: 'JOG'; event: { type: 'SLOW_DOWN' } }];
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
      transitions: [{ to: 'ALIVE'; event: { type: 'RESURRECT' } }];
    };
    ALIVE: {
      context: {};
      transitions: [{ to: 'DEAD'; event: { to: 'DIE' } }];
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

interface StateValue<
  TProtocol extends StateProtocol<any>,
  TValue extends keyof TProtocol['states']
> {
  context: ContextMapFromStateProtocol<TProtocol>[TValue];
  value: TValue;
  // prettier-ignore
  transition: <E extends EventsFromValue<StateValue<TProtocol, TValue>>>(
    e: E
    // @ts-ignore Need to fix this constraint
  ) => StateValue<TProtocol, EventToTransition<StateValue<TProtocol, TValue>, E>['to']>;
}

type Protocol<T> = T extends ProtocolConfig<infer P, any, any> ? P : never;

export function stateValueFromConfig<T extends ProtocolConfig<any, any, any>>(
  config: T
): StateValue<Protocol<T>, T['initial']> {
  return {
    context: config.context,
    value: config.initial,
  } as StateValue<Protocol<T>, T['initial']>;
}

type ProtocolFromValue<T> = T extends StateValue<infer Protocol, infer Value>
  ? {
      value: Value;
      protocol: Protocol;
    }
  : never;

type EventsFromValue<T> = T extends StateValue<infer Protocol, infer Value>
  ? EventUnionFromStateProtocolNode<Protocol, Value>
  : any;

// based off of E, I need to go pluck the appropriate transition
// pluck the 'to' property from the transitions
// new state values context and value are based on this 'to'

type TransitionUnionFromStateValue<T extends StateValue<any, any>> =
  // E extends EventsFromValue<ProtocolFromValue<T>>
  ProtocolFromValue<T>['protocol'][keyof ProtocolFromValue<
    T
  >['protocol']][ProtocolFromValue<T>['value']]['transitions'][number];

type B = EventToTransition<typeof initialState, TimerEvent>;

type EventToTransition<
  T extends StateValue<any, any>,
  E extends EventsFromValue<T>
> = Extract<TransitionUnionFromStateValue<T>, { event: E }>;

type ValueToState<T extends StateProtocol<any>, K extends keyof T['states']> = {
  context: T['states']['context'];
  value: K;
};

const initialState = stateValueFromConfig(lightConfig);
const greenState = initialState.transition({ type: 'TIMER' });
const redState = greenState.transition({ type: 'POWER_OUTAGE' });
