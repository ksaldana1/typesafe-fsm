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
