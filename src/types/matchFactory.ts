import { StateProtocol } from './StateProtocol';
import { Lookup } from './utils';

// type-safe match factory
export function matchFactory<T extends StateProtocol<any>>() {
  function match<K extends keyof T['states']>(k: K): boolean;
  function match<
    K extends keyof T['states'],
    K1 extends keyof Lookup<Lookup<T['states'][K], 'states'>, 'states'>
  >(k: K, k1: K1): boolean;
  function match<
    K extends keyof T['states'],
    K1 extends keyof Lookup<Lookup<T['states'][K], 'states'>, 'states'>,
    K2 extends keyof Lookup<
      Lookup<Lookup<Lookup<Lookup<T['states'][K], 'states'>, 'states'>, K1>, 'states'>,
      'states'
    >
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
