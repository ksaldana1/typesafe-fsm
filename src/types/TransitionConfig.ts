import {
  StateProtocol,
  EventUnionFromStateProtocolNode,
  ContextMapFromStateProtocol,
  TransitionUnionFromStateProtocolNode,
} from './StateProtocol';
import { NullEvent, SingleOrArray } from './utils';
import { Observable } from 'rxjs';

export interface TransitionConfig<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> {
  on?: EventTransitionConfigurationMap<TProtocol, TNode, TActions>;
  states?: TProtocol['states'][TNode]['states'] extends StateProtocol<any>
    ? TransitionConfigMap<TProtocol['states'][TNode]['states'], TActions> & {
        initial?: keyof TProtocol['states'][TNode]['states']['states'];
      }
    : never;
  invoke?: (
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    event: Extract<
      TransitionUnionFromStateProtocolNode<TProtocol, keyof TProtocol['states']>,
      { to: TNode }
    >['event']
  ) => Observable<TProtocol['states'][TNode]['transitions'][number]['event']>;
}

export type TransitionConfigMap<T extends StateProtocol<any>, TActions extends string> = {
  [K in keyof T['states']]: TransitionConfig<T, K, TActions>
};

export type AssignFunction<TContext, TEvent, TReturnContext> = (
  ctx: TContext,
  event: TEvent
) => TReturnContext;

export type AddNullTransition<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states']
> = NullEvent extends Extract<
  EventUnionFromStateProtocolNode<TProtocol, TNode>,
  NullEvent
>
  ? ''
  : never;

export type EventTransitionConfigurationMap<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> = {
  [E in EventUnionFromStateProtocolNode<TProtocol, TNode>['type']]: SingleOrArray<
    ActionTargetUnionConfig<TProtocol, TNode, E, TActions>[keyof ActionTargetUnionConfig<
      TProtocol,
      TNode,
      E,
      TActions
    >]
  >
};

export type AssignUnionUtility<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string
> = {
  [K in TransitionUnionFromStateProtocolNode<TProtocol, TNode>['to']]: AssignFunction<
    ContextMapFromStateProtocol<TProtocol>[TNode],
    Extract<EventUnionFromStateProtocolNode<TProtocol, TNode>, { type: TEventType }>,
    ContextMapFromStateProtocol<TProtocol>[K]
  >
};

export type ActionTargetUnionConfig<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string,
  TActions extends string
> = {
  [K in TransitionUnionFromStateProtocolNode<TProtocol, TNode>['to']]: {
    // extract target "to" value from event transitions config
    target: K;
    actions: SingleOrArray<
      | AssignFunction<
          ContextMapFromStateProtocol<TProtocol>[TNode],
          Extract<
            EventUnionFromStateProtocolNode<TProtocol, TNode>,
            { type: TEventType }
          >,
          ContextMapFromStateProtocol<TProtocol>[K]
        >
      | TActions
    >;

    cond?: (
      // current context
      ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
      // extract full event given type
      event: Extract<
        EventUnionFromStateProtocolNode<TProtocol, TNode>,
        { type: TEventType }
      >
    ) => boolean;
  }
};

export type EventTransitionConfiguration<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEventType extends string,
  TActions extends string
> = ActionTargetUnionConfig<TProtocol, TNode, TEventType, TActions> & {
  cond?: (
    // current context
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    // extract full event given type
    event: Extract<
      EventUnionFromStateProtocolNode<TProtocol, TNode>,
      { type: TEventType }
    >
  ) => boolean;
}; // maybe narrow this
