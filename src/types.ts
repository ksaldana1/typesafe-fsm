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
export type ContextMapFromStateSchema<TStateSchema extends StateProtocol<any, any>> = {
  [K in keyof TStateSchema['states']]: TStateSchema['states'][K]['context']
};

export type ContextUnionFromStateSchema<
  TStateSchema extends StateProtocol<any, any>
> = TStateSchema['states'][keyof TStateSchema['states']]['context'];

type EventUnionFromStateSchema<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number]['event'];

type TransitionUnionFromStateSchema<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number];

export interface TransitionConfig<
  TSchema extends StateProtocol<any, any>,
  TNode extends keyof TSchema['states']
> {
  on: {
    [E in EventUnionFromStateSchema<TSchema, TNode>['type']]: AssignFunction<
      ContextMapFromStateSchema<TSchema>[TNode],
      Extract<EventUnionFromStateSchema<TSchema, TNode>, { type: E }>,
      ContextMapFromStateSchema<TSchema>[Extract<
        TransitionUnionFromStateSchema<TSchema, TNode>,
        { event: { type: E } }
      >['to']]
    >
  };
  states?: TSchema['states'][TNode]['states'] extends StateProtocol<any, any>
    ? TransitionConfigMap<TSchema['states'][TNode]['states']>
    : never;
}

export type TransitionConfigMap<T extends StateProtocol<any, any>> = {
  [K in keyof T['states']]: TransitionConfig<T, K>
};

export type AssignFunction<TContext, TEvent extends EventObject, TReturnContext> = (
  ctx: TContext,
  event: TEvent
) => TReturnContext;

export interface SchemaConfig<
  T extends StateProtocol<any, any>,
  K extends keyof T['states']
> {
  initial: K;
  context?: ContextMapFromStateSchema<T>[K];
  states: TransitionConfigMap<T>;
}

interface Schema {
  states?: Record<string, Schema>;
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((
  k: infer I
) => void)
  ? I
  : never;

//  use Lookup<T, K> instead of T[K] in cases where the compiler
//  cannot verify that K is a key of T
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
