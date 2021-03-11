import {IOperandable} from './interfaces';
import {IColumnRef} from "./intermediate";

//@ts-ignore
declare class ColumnWrapper<T> implements IOperandable<T> {
  constructor(column: string);
  constructor(ref: string | IColumnRef);
}

//@ts-ignore
declare class FunctionCall<T> implements IOperandable<T> {
  constructor(func: string, args: any[]);
}

//@ts-ignore
declare class Operandable<T> implements IOperandable<T> {
  constructor(operator: string, operands: any[]);
}

declare const SupportedOperations: any;

export {ColumnWrapper, FunctionCall, Operandable, SupportedOperations}
