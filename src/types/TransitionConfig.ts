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
  on?: {
    [E in
      | Exclude<
          EventUnionFromStateProtocolNode<TProtocol, TNode>['type'],
          NullEvent['type']
        >
      | AddNullTransition<TProtocol, TNode>]: SingleOrArray<{
      actions: SingleOrArray<
        | AssignFunction<
            ContextMapFromStateProtocol<TProtocol>[TNode],
            Extract<
              EventUnionFromStateProtocolNode<TProtocol, TNode>,
              { type: '' extends E ? NullEvent['type'] : E }
            >,
            ContextMapFromStateProtocol<TProtocol>[Extract<
              TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
              { event: { type: '' extends E ? NullEvent['type'] : E } }
            >['to']]
          >
        | TActions
      >;
      target: Extract<
        TransitionUnionFromStateProtocolNode<TProtocol, TNode>,
        { event: { type: '' extends E ? NullEvent['type'] : E } }
      >['to'];
      cond?: (
        ctx: ContextMapFromStateProtocol<TProtocol>[TNode],
        event: Extract<
          EventUnionFromStateProtocolNode<TProtocol, TNode>,
          { type: '' extends E ? NullEvent['type'] : E }
        >
      ) => boolean;
    }>
  };
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
