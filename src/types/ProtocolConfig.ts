import {
  StateProtocol,
  ContextMapFromStateProtocol,
  ContextUnionFromStateProtocol,
  EventUnionFromStateProtocolNode,
} from './StateProtocol';
import { TransitionConfigMap } from './TransitionConfig';

export interface ProtocolConfig<
  T extends StateProtocol<any>,
  K extends keyof T['states'],
  TActions extends string
> {
  initial: K;
  context: ContextMapFromStateProtocol<T>[K];
  states: TransitionConfigMap<T, TActions>;
}

export type ActionImplementations<T> = T extends ProtocolConfig<
  infer Protocol,
  any,
  infer Actions
>
  ? {
      [K in Actions]: (
        ctx: ContextUnionFromStateProtocol<Protocol>,
        event: EventUnionFromStateProtocolNode<Protocol, keyof Protocol['states']>
      ) => void
    }
  : never;
