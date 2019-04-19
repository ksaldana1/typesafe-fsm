import { EventObject } from 'xstate';

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

export interface TransitionConfig<
  TProtocol extends StateProtocol<any, any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> {
  on?: {
    [E in EventUnionFromStateProtocol<TProtocol, TNode>['type']]: {
      actions: Array<
        | AssignFunction<
            ContextMapFromStateProtocol<TProtocol>[TNode],
            Extract<EventUnionFromStateProtocol<TProtocol, TNode>, { type: E }>,
            ContextMapFromStateProtocol<TProtocol>[Extract<
              TransitionUnionFromStateProtocol<TProtocol, TNode>,
              { event: { type: E } }
            >['to']]
          >
        | TActions
      >;
      target: Extract<
        TransitionUnionFromStateProtocol<TProtocol, TNode>,
        { event: { type: E } }
      >['to'];
    }
  };
  states?: TProtocol['states'][TNode]['states'] extends StateProtocol<any, any>
    ? TransitionConfigMap<TProtocol['states'][TNode]['states'], TActions>
    : never;
  invoke?: (
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    event: Extract<
      TransitionUnionFromStateProtocol<TProtocol, keyof TProtocol['states']>,
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

export type InvokeMapper<
  TSuccessTransition extends Transition<any, any>,
  TErrorTransition extends Transition<any, any>
> = {
  onDone: TSuccessTransition;
  onError: TErrorTransition;
};

export type InvokeImplementationConfig<
  T extends StateProtocol<any, any>,
  K extends keyof T['states'],
  TConfig extends InvokeMapper<any, any>
> = {
  src: (
    ctx: ContextMapFromStateProtocol<T>[K],
    event: Extract<
      ContextMapFromStateProtocol<T>[keyof T['states']]['transitions'],
      { to: K }
    >
  ) => Promise<TConfig['onDone']['event']['payload']>;
  onDone: (
    ctx: ContextMapFromStateProtocol<T>[K],
    event: TConfig['onDone']['event']
  ) => ContextMapFromStateProtocol<T>[TConfig['onDone']['to']];
  onError: (
    ctx: ContextMapFromStateProtocol<T>[K],
    event: TConfig['onError']['event']
  ) => ContextMapFromStateProtocol<T>[TConfig['onError']['to']];
};

export type InvokeImplementationMap<
  T extends StateProtocol<any, any>,
  TConfig extends { [K in keyof T['states']]?: InvokeMapper<any, any> }
> = { [K in keyof T['states']]: InvokeImplementationConfig<T, K, TConfig[K]> };

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

// Playing with invoke types
export type ServiceCall<TContext, TEvent, TReturnValue> = (
  ctx: TContext,
  event: TEvent
) => Promise<TReturnValue>;

export type PluckProtocolGenerics<T> = T extends StateProtocol<
  infer TEvents,
  infer TStates
>
  ? { events: TEvents; states: TStates }
  : never;

export type InvokeConfig<
  TProtocol extends StateProtocol<any, any>,
  K extends keyof TProtocol['states'],
  TSuccessTransition extends PluckProtocolGenerics<TProtocol>['states'][K]['transitions']
> =
  // TErrorTransition extends PluckProtocolGenerics<TProtocol>['states'][K]['transitions']
  {
    service: ServiceCall<
      ContextMapFromStateProtocol<TProtocol>[K],
      TSuccessTransition['event'],
      TSuccessTransition['event']['payload']
    >;
    onDone: {
      target: TSuccessTransition['to'];
      onDone: (
        ctx: ContextMapFromStateProtocol<TProtocol>[K],
        event: { data: TSuccessTransition['event']['payload'] }
      ) => ContextMapFromStateProtocol<TProtocol>[TSuccessTransition['to']];
    };
  };
