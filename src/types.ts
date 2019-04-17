import { EventObject } from 'xstate';

export interface StateSchema<TEvents extends EventObject, TAllStates extends string> {
  states: { [K in TAllStates]: StateNode<TEvents, TAllStates> };
}

export interface StateNode<
  TEvents extends EventObject,
  TAllStates extends string,
  TContext = any
> {
  context: TContext;
  transitions: Array<Transition<TEvents, TAllStates>>;
  states?: StateSchema<TEvents, any>;
}

export interface Transition<TEvents extends EventObject, TAllStates extends string> {
  to: TAllStates;
  event: TEvents;
}
// I'm sorry Anders... this isn't your fault
export type ContextMapFromStateSchema<TStateSchema extends StateSchema<any, any>> = {
  [K in keyof TStateSchema['states']]: TStateSchema['states'][K]['context']
};

export type ContextUnionFromStateSchema<
  TStateSchema extends StateSchema<any, any>
> = TStateSchema['states'][keyof TStateSchema['states']]['context'];

type EventUnionFromStateSchema<
  T extends StateSchema<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number]['event'];

type TransitionUnionFromStateSchema<
  T extends StateSchema<any, any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number];

export interface TransitionConfig<
  TSchema extends StateSchema<any, any>,
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
  states?: TSchema['states'][TNode]['states'] extends StateSchema<any, any>
    ? TransitionConfigMap<TSchema['states'][TNode]['states']>
    : never;
}

export type TransitionConfigMap<T extends StateSchema<any, any>> = {
  [K in keyof T['states']]: TransitionConfig<T, K>
};

export type AssignFunction<TContext, TEvent extends EventObject, TReturnContext> = (
  ctx: TContext,
  event: TEvent
) => TReturnContext;

export interface SchemaConfig<
  T extends StateSchema<any, any>,
  K extends keyof T['states']
> {
  initial: K;
  context?: ContextMapFromStateSchema<T>[K];
  states: TransitionConfigMap<T>;
}

interface TestInterface {
  states: {
    GREEN: {};
    YELLOW: {};
    RED: {
      states: {
        WALK: {};
        WAIT: {
          WAIN: {
            WARD: {};
          };
        };
        STOP: {
          WAX: {};
        };
      };
    };
  };
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
type Lookup<T, K> = K extends keyof T ? T[K] : never;
type B = TestInterface['states'];

declare function match<K extends keyof TestInterface['states']>(arg: [K]): boolean;
declare function match<
  K extends keyof TestInterface['states'],
  K1 extends keyof Lookup<TestInterface['states'][K], 'states'>
>(arg: [K, K1]): boolean;
declare function match<
  K extends keyof TestInterface['states'],
  K1 extends keyof Lookup<TestInterface['states'][K], 'states'>,
  K2 extends keyof Lookup<Lookup<TestInterface['states'][K], 'states'>, K1>
>(arg: [K, K1, K2]): boolean;
declare function match<
  K extends keyof TestInterface['states'],
  K1 extends keyof Lookup<TestInterface['states'][K], 'states'>,
  K2 extends keyof Lookup<Lookup<TestInterface['states'][K], 'states'>, K1>,
  K3 extends keyof Lookup<Lookup<Lookup<TestInterface['states'][K], 'states'>, K1>, K2>
>(arg: [K, K1, K2, K3]): boolean;

const b = match(['RED', 'WAIT', 'WAIN', 'WARD']);
