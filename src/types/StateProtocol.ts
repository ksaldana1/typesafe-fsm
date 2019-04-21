export interface StateProtocol<T extends Record<any, StateNode<any, any>>> {
  states: T;
}

export interface StateNode<TAllStates extends string, TEvents, TContext = any> {
  context: TContext;
  transitions: Array<Transition<TEvents, TAllStates>>;
  states?: StateProtocol<any>;
}

export interface Transition<TEvents, TAllStates extends string> {
  to: TAllStates;
  event: TEvents;
}

export type ContextMapFromStateProtocol<TStateSchema extends StateProtocol<any>> = {
  [K in keyof TStateSchema['states']]: TStateSchema['states'][K]['context']
};

export type ContextUnionFromStateProtocol<
  TStateSchema extends StateProtocol<any>
> = TStateSchema['states'][keyof TStateSchema['states']]['context'];

export type EventUnionFromStateProtocolNode<
  T extends StateProtocol<any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number]['event'];

export type TransitionUnionFromStateProtocolNode<
  T extends StateProtocol<any>,
  K extends keyof T['states']
> = T['states'][K]['transitions'][number];
