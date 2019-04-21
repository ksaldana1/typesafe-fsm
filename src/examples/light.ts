import {
  ProtocolConfig,
  StateProtocol,
  StateNode,
  Lookup,
  EventUnionFromStateProtocolNode,
  TransitionUnionFromStateProtocolNode,
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
  TValue extends keyof TProtocol['states'],
  TContext
> {
  context: TContext;
  value: TValue;
  transition: <T>(i: T) => T;
}

declare function transition<E extends EventsFromValue<T>>(
  event: E
): StateValue<
  ProtocolFromValue<T>['protocol'],
  ValueToState<ProtocolFromValue<T>['protocol'], EventToTransition<T, E>>['value'],
  ValueToState<ProtocolFromValue<T>['protocol'], EventToTransition<T, E>>['context']
>;

type Protocol<T> = T extends ProtocolConfig<infer P, any, any> ? P : never;

function stateValueFromConfig<T extends ProtocolConfig<any, any, any>>(
  config: T
): StateValue<Protocol<T>, T['initial'], T['context']> {
  return {
    context: config.context,
    value: config.initial,
  };
}

type ProtocolFromValue<T> = T extends StateValue<
  infer Protocol,
  infer Value,
  infer Context
>
  ? {
      context: Context;
      value: Value;
      protocol: Protocol;
    }
  : never;

type EventsFromValue<T> = T extends StateValue<infer Protocol, infer Value, any>
  ? EventUnionFromStateProtocolNode<Protocol, Value>
  : any;

// based off of E, I need to go pluck the appropriate transition
// pluck the 'to' property from the transitions
// new state values context and value are based on this 'to'

type TransitionUnionFromStateValue<T extends StateValue<any, any, any>> =
  // E extends EventsFromValue<ProtocolFromValue<T>>
  ProtocolFromValue<T>['protocol'][keyof ProtocolFromValue<
    T
  >['protocol']][ProtocolFromValue<T>['value']]['transitions'][number];

type B = TransitionUnionFromStateValue<typeof b>;

type EventToTransition<
  T extends StateValue<any, any, any>,
  E extends EventsFromValue<T>
> = Extract<TransitionUnionFromStateValue<T>, { event: E }>;

type ValueToState<T extends StateProtocol<any>, K extends keyof T['states']> = {
  context: T['states']['context'];
  value: K;
};

declare function transition<
  T extends StateValue<any, any, any>,
  E extends EventsFromValue<T>
>(
  state: T,
  event: E
): StateValue<
  ProtocolFromValue<T>['protocol'],
  ValueToState<ProtocolFromValue<T>['protocol'], EventToTransition<T, E>>['value'],
  ValueToState<ProtocolFromValue<T>['protocol'], EventToTransition<T, E>>['context']
>;

// I want a state value with the transitioned to Context & Value

const initialState = stateValueFromConfig(lightConfig);
type c = EventsFromValue<typeof initialState>;

const newState = transition(initialState, { type: 'POWER_OUTAGE' });
