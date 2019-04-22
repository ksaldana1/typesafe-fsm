import { ProtocolConfig } from './ProtocolConfig';
import {
  EventUnionFromStateProtocolNode,
  StateProtocol,
  Transition,
  ContextMapFromStateProtocol,
  TransitionUnionFromStateProtocolNode,
} from './StateProtocol';
import { UnionToTuple } from './utils';

export interface StateValue<
  TProtocol extends StateProtocol<any>,
  TValue extends keyof TProtocol['states']
> {
  context: ContextMapFromStateProtocol<TProtocol>[TValue];
  value: TValue;
  transition: <E extends EventsFromValue<StateValue<TProtocol, TValue>>>(
    e: E
  ) => StateValue<
    TProtocol,
    ExtractTo<EventToTransition<StateValue<TProtocol, TValue>, E>>
  >;
  nextEvents: UnionToTuple<
    TransitionUnionFromStateProtocolNode<TProtocol, TValue>['event']['type']
  >;
}

type Protocol<T> = T extends ProtocolConfig<infer P, any, any> ? P : never;

export function createStateFromConfig<T extends ProtocolConfig<any, any, any>>(
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

type EventsFromValue<T extends StateValue<any, any>> = T extends StateValue<
  infer Protocol,
  infer Value
>
  ? EventUnionFromStateProtocolNode<Protocol, Value>
  : never;

// based off of E, I need to go pluck the appropriate transition
// pluck the 'to' property from the transitions
// new state values context and value are based on this 'to'

type TransitionUnionFromStateValue<T extends StateValue<any, any>> =
  // E extends EventsFromValue<ProtocolFromValue<T>>
  ProtocolFromValue<T>['protocol'][keyof ProtocolFromValue<
    T
  >['protocol']][ProtocolFromValue<T>['value']]['transitions'][number];

type EventToTransition<
  T extends StateValue<any, any>,
  E extends EventsFromValue<T>
> = Extract<TransitionUnionFromStateValue<T>, { event: E }>;

type ExtractTo<T> = T extends Transition<any, infer To> ? To : never;
