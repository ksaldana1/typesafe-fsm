import { EventObject, SingleOrArray } from 'xstate';

export interface StateProtocol<TEvents extends EventObject, TAllStates extends string> {
  states: { [K in TAllStates]: StateNode<TEvents, TAllStates> };
}

export interface StateNode<
  TEvents extends EventObject,
  TAllStates extends string,
  TContext = any
> {
  context: TContext;
  transitions: Array<Transition<TEvents, TAllStates>>;
  states?: StateProtocol<TEvents, any>;
}
export interface Transition<TEvents extends EventObject, TAllStates extends string> {
  to: TAllStates;
  event: TEvents;
}
// I'm sorry Anders... this isn't your fault
export type ContextMapFromStateProtocol<TStateSchema extends StateProtocol<any, any>> = {
  [K in keyof TStateSchema['states']]: TStateSchema['states'][K]['context']
};

export type ContextUnionFromStateProtocol<
  TStateSchema extends StateProtocol<any, any>
> = TStateSchema['states'][keyof TStateSchema['states']]['context'];

export type EventUnionFromStateProtocol<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number]['event'];

export type TransitionUnionFromStateProtocol<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number];

export type EventTransitionConfigurationMap<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> = {
  [E in EventUnionFromStateProtocol<TProtocol, TNode>['type']]: SingleOrArray<
    ActionTargetUnionConfig<TProtocol, TNode, E>[keyof ActionTargetUnionConfig<
      TProtocol,
      TNode,
      E
    >]
  >
};

export type AssignUnionUtility<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string
> = {
  [K in TransitionUnionFromStateProtocol<TProtocol, TNode>['to']]: AssignFunction<
    ContextMapFromStateProtocol<TProtocol>[TNode],
    Extract<EventUnionFromStateProtocol<TProtocol, TNode>, { type: TEventType }>,
    ContextMapFromStateProtocol<TProtocol>[K]
  >
};

export type ActionTargetUnionConfig<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string
> = {
  [K in TransitionUnionFromStateProtocol<TProtocol, TNode>['to']]: {
    actions: AssignFunction<
      ContextMapFromStateProtocol<TProtocol>[TNode],
      Extract<EventUnionFromStateProtocol<TProtocol, TNode>, { type: TEventType }>,
      ContextMapFromStateProtocol<TProtocol>[K]
    >;

    // extract target "to" value from event transitions config
    target: K;
    cond?: (
      // current context
      ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
      // extract full event given type
      event: Extract<EventUnionFromStateProtocol<TProtocol, TNode>, { type: TEventType }>
    ) => boolean;
  }
};

export type EventTransitionConfiguration<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string
> = ActionTargetUnionConfig<TProtocol, TNode, TEventType> & {
  cond?: (
    // current context
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    // extract full event given type
    event: Extract<EventUnionFromStateProtocol<TProtocol, TNode>, { type: TEventType }>
  ) => boolean;
}; // maybe narrow this
export interface TransitionConfig<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> {
  on?: EventTransitionConfigurationMap<TProtocol, TNode, TActions>;
  // Does this node have substate? If so recurse TransitionConfig
  states?: TProtocol['states'][TNode]['states'] extends StateProtocol<any, any>
    ? TransitionConfigMap<TProtocol['states'][TNode]['states'], TActions>
    : never;
  invoke?: (
    // current context
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    // extract full event given type and transition config
    event: Extract<
      TransitionUnionFromStateProtocol<TProtocol, keyof TProtocol['states']>,
      { to: TNode }
    >
  ) => TProtocol['states'][TNode]['transitions'][number]['event']; // return union of valid transitions
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
        event: EventUnionFromStateProtocol<Protocol, keyof Protocol['states']>
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
    K2 extends keyof Lookup<Lookup<Lookup<T['states'][K], 'states'>, K1>, 'states'>
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
