export interface NullEvent {
  type: '@XSTATE_INTERNAL_NULL_EVENT';
}

export type SingleOrArray<T> = T[] | T;

/* 
  use Lookup<T, K> instead of T[K] in cases where the compiler
  cannot verify that K is a key of T
*/
export type Lookup<T, K> = K extends keyof T ? T[K] : never;
type Overwrite<T, S extends any> = { [P in keyof T]: S[P] };
type TupleUnshift<T extends any[], X> = T extends any
  ? ((x: X, ...t: T) => void) extends (...t: infer R) => void
    ? R
    : never
  : never;
type TuplePush<T extends any[], X> = T extends any
  ? Overwrite<TupleUnshift<T, any>, T & { [x: string]: X }>
  : never;

export type UnionToTuple<U> = UnionToTupleRecursively<[], U>;
type UnionToTupleRecursively<T extends any[], U> = {
  1: T;
  0: UnionToTupleRecursively_<T, U, U>;
}[[U] extends [never] ? 1 : 0];

type UnionToTupleRecursively_<T extends any[], U, S> = S extends any
  ? UnionToTupleRecursively<TupleUnshift<T, S> | TuplePush<T, S>, Exclude<U, S>>
  : never;
