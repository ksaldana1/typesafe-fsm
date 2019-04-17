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

interface PedestrianProtocol {
  states: {
    WALK: {};
    WAIT: {};
    STOP: {};
  };
}
interface LightProtocol {
  states: {
    GREEN: {
      context: {
        value: 'GREEN';
      };
      transition: [{ to: 'YELLOW' }];
    };
    YELLOW: {};
    RED: PedestrianProtocol;
  };
}

const valid1 = match('RED', 'STOP');
const valid2 = match('RED', 'STOP', 'REALLY_STOP');
const valid3 = match('GREEN');
const valid4 = match('YELLOW');
const valid5 = match('RED');

const invalid1 = match('RED', 'ST');
const invalid2 = match('GREEN', 'STOP');
const invalid3 = match('RE');
const invalid4 = match('');
