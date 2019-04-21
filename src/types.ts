import { EventObject, SingleOrArray } from 'xstate';

export interface StateProtocol<TAllStates extends string, TEvents extends EventObject> {
  states: { [K in TAllStates]: StateNode<TAllStates, TEvents> };
}

export interface StateNode<
  TAllStates extends string,
  TEvents extends EventObject,
  TContext = any
> {
  context: TContext;
  transitions: Array<Transition<TEvents, TAllStates>>;
  states?: StateProtocol<any, any>;
}

export interface Transition<TEvents extends EventObject, TAllStates extends string> {
  to: TAllStates;
  event: TEvents;
}

export interface NullEvent {
  type: '@XSTATE_INTERNAL_NULL_EVENT';
}

// I'm sorry Anders... this isn't your fault

export type ContextMapFromStateProtocol<TStateSchema extends StateProtocol<any, any>> = {
  [K in keyof TStateSchema['states']]: TStateSchema['states'][K]['context']
};

export type ContextUnionFromStateProtocol<
  TStateSchema extends StateProtocol<any, any>
> = TStateSchema['states'][keyof TStateSchema['states']]['context'];

export type EventUnionFromStateProtocolNode<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number]['event'];

export type TransitionUnionFromStateProtocolNode<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number];

export type AddNullTransition<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states']
> = NullEvent extends Extract<
  EventUnionFromStateProtocolNode<TProtocol, TNode>,
  NullEvent
>
  ? ''
  : never;
export interface TransitionConfig<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> {
  on?: {
    [E in
      | Exclude<
          EventUnionFromStateProtocolNode<TProtocol, TNode>['type'],
          NullEvent['type']
        >
      | AddNullTransition<TProtocol, TNode>]: SingleOrArray<{
      actions: Array<
        | AssignFunction<
            ContextMapFromStateProtocol<TProtocol>[TNode],
            Extract<
              EventUnionFromStateProtocolNode<TProtocol, TNode>,
              { type: '' extends E ? NullEvent['type'] : E }
            >,
            ContextMapFromStateProtocol<TProtocol>[Extract<
              TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
              { event: { type: '' extends E ? NullEvent['type'] : E } }
            >['to']]
          >
        | TActions
      >;
      target: Extract<
        TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
        { event: { type: '' extends E ? NullEvent['type'] : E } }
      >['to'];
      cond?: (
        ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
        event: Extract<
          EventUnionFromStateProtocolNode<TProtocol, TNode>,
          { type: '' extends E ? NullEvent['type'] : E }
        >
      ) => boolean;
    }>
  };
  states?: TProtocol['states'][TNode]['states'] extends StateProtocol<any, infer States>
    ? TransitionConfigMap<TProtocol['states'][TNode]['states'], TActions> & {
        initial?: keyof TProtocol['states'][TNode]['states']['states'];
      }
    : never;
  invoke?: (
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    event: Extract<
      TransitionUnionFromStateProtocolNode<TProtocol, keyof TProtocol['states']>,
      { to: TNode }
    >
  ) => TProtocol['states'][TNode]['transitions'][number]['event'];
}

export type TransitionConfigMap<
  T extends StateProtocol<any, any>,
  TActions extends string
> = { [K in keyof T['states']]: TransitionConfig<T, K, TActions> };

export type AssignFunction<TContext, TEvent extends EventObject, TReturnContext> = (
  ctx: TContext,
  event: TEvent
) => TReturnContext;

export interface ProtocolConfig<
  T extends StateProtocol<any, any>,
  K extends keyof T['states'],
  TActions extends string
> {
  initial: K;
  context?: ContextMapFromStateProtocol<T>[K];
  states: TransitionConfigMap<T, TActions>;
}

export type ActionImplementations<T> = T extends ProtocolConfig<
  infer Protocol,
  any,
  infer Actions
>
  ? {
      [K in Actions]: (
        ctx: ContextUnionFromStateProtocol<Protocol>,
        event: EventUnionFromStateProtocolNode<Protocol, keyof Protocol['states']>
      ) => void
    }
  : never;

/* 
  use Lookup<T, K> instead of T[K] in cases where the compiler
  cannot verify that K is a key of T
*/
export type Lookup<T, K> = K extends keyof T ? T[K] : never;

// type-safe match factory
export function matchFactory<T extends StateProtocol<any, any>>() {
  function match<K extends keyof T['states']>(k: K): boolean;
  function match<
    K extends keyof T['states'],
    K1 extends keyof Lookup<Lookup<T['states'][K], 'states'>, 'states'>
  >(k: K, k1: K1): boolean;
  function match<
    K extends keyof T['states'],
    K1 extends keyof Lookup<Lookup<T['states'][K], 'states'>, 'states'>,
    K2 extends keyof Lookup<
      Lookup<Lookup<Lookup<Lookup<T['states'][K], 'states'>, 'states'>, K1>, 'states'>,
      'states'
    >
  >(k: K, k1: K1, k2: K2): boolean;
  function match<
    K extends keyof T['states'],
    K1 extends keyof Lookup<Lookup<T['states'][K], 'states'>, 'states'>,
    K2 extends keyof Lookup<Lookup<Lookup<T['states'][K], 'states'>, K1>, 'states'>,
    K3 extends keyof Lookup<
      Lookup<Lookup<Lookup<T['states'][K], 'states'>, K1>, K2>,
      'states'
    >
  >(k: K, k1: K1, k2: K2, k3: K3): boolean;
  function match(...args: any[]) {
    // mock impl
    return true;
  }
  return match;
}
