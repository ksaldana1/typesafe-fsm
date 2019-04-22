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
  on?: OnTransitionConfigMap<TProtocol, TNode, TActions>;
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

export type OnTransitionConfigMap<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TActions extends string
> = {
  [E in
    | Exclude<
        EventUnionFromStateProtocolNode<TProtocol, TNode>['type'],
        NullEvent['type']
      >
    | AddNullTransition<TProtocol, TNode>]: OnTransitionConfig<
    TProtocol,
    TNode,
    E,
    TActions
  >
};

export type OnTransitionConfig<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEvent,
  TActions extends string
> = SingleOrArray<TargetConfig<TProtocol, TNode, TEvent, TActions>>;

export type TargetConfig<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEvent,
  TActions extends string
> = TargetActions<TProtocol, TNode, TEvent, TActions>[keyof TargetActions<
  TProtocol,
  TNode,
  TEvent,
  TActions
>] & {
  cond?: (
    ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
    event: Extract<
      EventUnionFromStateProtocolNode<TProtocol, TNode>,
      { type: '' extends TEvent ? NullEvent['type'] : TEvent }
    >
  ) => boolean;
};

export type TargetActions<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEvent,
  TActions extends string
> = {
  [K in Extract<
    TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
    { event: { type: TEvent } }
  >['to']]: {
    actions: SingleOrArray<
      | AssignFunction<
          ContextMapFromStateProtocol<TProtocol>[TNode],
          Extract<
            EventUnionFromStateProtocolNode<TProtocol, TNode>,
            { type: '' extends TEvent ? NullEvent['type'] : TEvent }
          >,
          ContextMapFromStateProtocol<TProtocol>[K]
        >
      | TActions
    >;
    target: K;
  }
};

export type AssignUnion<
  TProtocol extends StateProtocol<any>,
  TNode extends keyof TProtocol['states'],
  TEvent
> = AssignFunction<
  ContextMapFromStateProtocol<TProtocol>[TNode],
  Extract<
    EventUnionFromStateProtocolNode<TProtocol, TNode>,
    { type: '' extends TEvent ? NullEvent['type'] : TEvent }
  >,
  ContextMapFromStateProtocol<TProtocol>[Extract<
    TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
    { event: { type: '' extends TEvent ? NullEvent['type'] : TEvent } }
  >['to']]
>;

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
