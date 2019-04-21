export interface NullEvent {
  type: '@XSTATE_INTERNAL_NULL_EVENT';
}

export type SingleOrArray<T> = T[] | T;

/* 
  use Lookup<T, K> instead of T[K] in cases where the compiler
  cannot verify that K is a key of T
*/
export type Lookup<T, K> = K extends keyof T ? T[K] : never;
