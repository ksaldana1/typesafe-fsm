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

export type TransitionConfig<T extends StateSchema<any, any>> = {
  [K in keyof T['states']]: {
    // oh god oh no
    on: {
      [E in EventUnionFromStateSchema<T, K>['type']]: SingleOrArray<
        ActionFunction<
          ContextMapFromStateSchema<T>[K],
          Extract<EventUnionFromStateSchema<T, K>, { type: E }>,
          ContextMapFromStateSchema<T>[Extract<
            TransitionUnionFromStateSchema<T, K>,
            { event: { type: E } }
          >['to']]
        >
      >
    };
    states?: T['states'][K]['states'] extends StateSchema<any, any>
      ? TransitionConfig<T['states'][K]['states']>
      : never;
  }
};

export type ActionFunction<TContext, TEvent extends EventObject, TReturnContext> = (
  ctx: TContext,
  event: TEvent
) => TReturnContext | void;

export type SingleOrArray<T> = T | T[];
