import {ElementType, IOperandable} from './interfaces';
import {IColumnRef} from "./intermediate";

declare class ColumnWrapper<T> implements IOperandable<T> {
  constructor(ref: IColumnRef);

  eq(value: T | IOperandable<T>): boolean;
  neq(value: T | IOperandable<T>): boolean;
  gt(value: T | IOperandable<T>): boolean;
  gte(value: T | IOperandable<T>): boolean;
  lt(value: T | IOperandable<T>): boolean;
  lte(value: T | IOperandable<T>): boolean;
  between(min: T | IOperandable<T>, max: T | IOperandable<T>): boolean;
  in(value: T[] | Iterable<T> | IOperandable<T[]>): boolean;
  has(value: (T extends any[] ? T[number] : T) | IOperandable<T extends any[] ? T[number] : T>): boolean;
  like(value: string): boolean;
  add(value: T | IOperandable<T>): IOperandable<T>;
  sub(value: T | IOperandable<T>): IOperandable<T>;
  mul(value: T | IOperandable<T>): IOperandable<T>;
  div(value: T | IOperandable<T>): IOperandable<T>;
  mod(value: T | IOperandable<T>): IOperandable<T>;
  and(value: T | IOperandable<T>): IOperandable<T>;
  or(value: T | IOperandable<T>): IOperandable<T>;
  xor(value: T | IOperandable<T>): IOperandable<T>;
}

declare class FunctionCall<T> implements IOperandable<T> {
  constructor(func: string, args: any[]);

  add(value: IOperandable<T> | T): IOperandable<T>;
  and(value: IOperandable<T> | T): IOperandable<T>;
  between(min: IOperandable<T> | T, max: IOperandable<T> | T): boolean;
  div(value: IOperandable<T> | T): IOperandable<T>;
  eq(value: IOperandable<T> | T): boolean;
  gt(value: IOperandable<T> | T): boolean;
  gte(value: IOperandable<T> | T): boolean;
  has(value: ElementType<T> | IOperandable<ElementType<T>>): boolean;
  in(value: T[] | Iterable<T> | IOperandable<T[]>): boolean;
  like(value: string): boolean;
  lt(value: IOperandable<T> | T): boolean;
  lte(value: IOperandable<T> | T): boolean;
  mod(value: IOperandable<T> | T): IOperandable<T>;
  mul(value: IOperandable<T> | T): IOperandable<T>;
  neq(value: IOperandable<T> | T): boolean;
  or(value: IOperandable<T> | T): IOperandable<T>;
  sub(value: IOperandable<T> | T): IOperandable<T>;
  xor(value: IOperandable<T> | T): IOperandable<T>;
}

declare class Operandable<T> implements IOperandable<T> {
  constructor(operator: string, operands: any[]);

  add(value: IOperandable<T> | T): IOperandable<T>;
  and(value: IOperandable<T> | T): IOperandable<T>;
  between(min: IOperandable<T> | T, max: IOperandable<T> | T): boolean;
  div(value: IOperandable<T> | T): IOperandable<T>;
  eq(value: IOperandable<T> | T): boolean;
  gt(value: IOperandable<T> | T): boolean;
  gte(value: IOperandable<T> | T): boolean;
  has(value: ElementType<T> | IOperandable<ElementType<T>>): boolean;
  in(value: T[] | Iterable<T> | IOperandable<T[]>): boolean;
  like(value: string): boolean;
  lt(value: IOperandable<T> | T): boolean;
  lte(value: IOperandable<T> | T): boolean;
  mod(value: IOperandable<T> | T): IOperandable<T>;
  mul(value: IOperandable<T> | T): IOperandable<T>;
  neq(value: IOperandable<T> | T): boolean;
  or(value: IOperandable<T> | T): IOperandable<T>;
  sub(value: IOperandable<T> | T): IOperandable<T>;
  xor(value: IOperandable<T> | T): IOperandable<T>;
}

declare const SupportedOperations: any;

export {ColumnWrapper, FunctionCall, Operandable, SupportedOperations}
