import {
  Column,
  IOperandable,
  Order,
  TableMetaProvider,
  ITableRef,
  ITableInfo,
  IBuildableSubSelectQuery
} from "./interfaces";
import {ColumnWrapper, FunctionCall, FunctionWindowCall, Operandable} from "./wrappers";
import {TableMetadataSymbol} from "./symbols";
import {Window} from "./builder";

export function and(...operands: (boolean | IOperandable<boolean>)[]): IOperandable<boolean> {
  return new Operandable('AND', operands) as IOperandable<boolean>
}

export function or(...operands: (boolean | IOperandable<boolean>)[]): IOperandable<boolean> {
  return new Operandable('OR', operands) as IOperandable<boolean>
}

export function not(condition: boolean | IOperandable<boolean>): IOperandable<boolean> {
  return new Operandable('NOT', [condition]) as IOperandable<boolean>
}

export function all<T=any>(subquery: IBuildableSubSelectQuery): IOperandable<T> {
  return new Operandable('ALL', [subquery]) as IOperandable<T>
}

export function any<T=any>(subquery: IBuildableSubSelectQuery): IOperandable<T> {
  return new Operandable('ANY', [subquery]) as IOperandable<T>
}

export function exists(subquery: IBuildableSubSelectQuery): IOperandable<boolean> {
  return new Operandable('EXISTS', [subquery]) as IOperandable<boolean>
}

export function avg<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('AVG', [value]) as IOperandable<T>
}

export function sum<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('SUM', [value]) as IOperandable<T>
}

export function count<T>(value?: IOperandable<T>): IOperandable<number>;
export function count<T>(value: IOperandable<T>, unique: true): IOperandable<number>;
export function count<T>(value?: IOperandable<T>, unique = false): IOperandable<number> {
  return new FunctionCall('COUNT', unique ? ['DISTINCT', value || '*'] : [value || '*']) as IOperandable<number>
}

export function max<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('MAX', [value]) as IOperandable<T>
}

export function min<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('MIN', [value]) as IOperandable<T>
}

export function asc<T>(value: Column<T>|IOperandable<T>|number, nulls?: 'LAST' | 'FIRST'): Order {
  return <any>{...(typeof value === 'number' ? {_column: value} : <any>value), _order: 'ASC', _nulls: nulls,}
}

export function desc<T>(value: Column<T>|IOperandable<T>|number, nulls?: 'LAST' | 'FIRST'): Order {
  return <any>{...(typeof value === 'number' ? {_column: value} : <any>value), _order: 'DESC', _nulls: nulls,}
}

export function of<T = unknown>(_: null, field: string): IOperandable<T>;
export function of<X extends TableMetaProvider, R=InstanceType<X>, F extends keyof R = keyof R>(_: X, field: F): IOperandable<R[F]>;
export function of<X extends TableMetaProvider, R=InstanceType<X>, F extends keyof R = keyof R>(_: ITableRef<X>, field: F): IOperandable<R[F]>;
export function of(_: unknown, field: string): IOperandable<any> {
  if (_ === null) {
    return (new ColumnWrapper({name: field}));
  }

  const {tableName, fields}: ITableInfo = _[TableMetadataSymbol] ?? _;

  if (!fields.has(field)) {
    throw new Error(`Field '${field}' should be annotated with @dbField() or @dbManyField()`);
  }
  const {name} = fields.get(field);
  return (new ColumnWrapper({table: tableName, name}));
}

export function alias<T>(expr: T | IOperandable<T>, name: string): IOperandable<T> {
  return {_alias: name, _operands: [expr]} as any;
}

export function cast<R=unknown, T=unknown>(expr: T | IOperandable<T>, type: string): IOperandable<R> {
  return new Operandable('CAST', [expr, type]) as IOperandable<R>
}

export type CaseOperand<T> = {when: IOperandable<boolean> | boolean; then: IOperandable<T> | T} | {else: IOperandable<T> | T};

export function case_<T = unknown>(...args: CaseOperand<T>[]): IOperandable<T> {
  let count = 0;
  for(const block of args) {
    count += ('else' in block) ? 1 : 0;
  }

  if (count > 1) {
    throw new Error(`CASE can contain only one ELSE block`);
  }

  if (count == 1 && !( 'else' in args[args.length - 1])) {
    throw new Error(`CASE should have ELSE as last block`);
  }

  return new Operandable('CASE', args);
}

export function row_number(
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<number> {
  return new FunctionWindowCall('row_number', filter ?? null, over, []) as IOperandable<number>
}

export function rank(
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<number> {
  return new FunctionWindowCall('rank', filter ?? null, over, []) as IOperandable<number>
}

export function dense_rank(
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<number> {
  return new FunctionWindowCall('dense_rank', filter ?? null, over, []) as IOperandable<number>
}

export function percent_rank(
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<number> {
  return new FunctionWindowCall('percent_rank', filter ?? null, over, []) as IOperandable<number>
}

export function cume_dist(
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<number> {
  return new FunctionWindowCall('cume_dist', filter ?? null, over, []) as IOperandable<number>
}



export function first_value<T>(
  value: Column<T>|IOperandable<T>,
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<unknown> {
  return new FunctionWindowCall('first_value', filter ?? null, over, [value]) as IOperandable<unknown>
}

export function last_value<T>(
  value: Column<T>|IOperandable<T>,
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<unknown> {
  return new FunctionWindowCall('last_value', filter ?? null, over, [value]) as IOperandable<unknown>
}

export function nth_value<T>(
  value: Column<T>|IOperandable<T>,
  n: number,
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<unknown> {
  return new FunctionWindowCall('nth_value', filter ?? null, over, [value, n]) as IOperandable<unknown>
}

export function lag<T>(
  value: Column<T>|IOperandable<T>,
  offset: number,
  def: T | null,
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<T> {
  return new FunctionWindowCall('lag', filter ?? null, over, [value, offset ?? 1, def ?? null]) as IOperandable<T>
}


export function lead<T>(
  value: Column<T>|IOperandable<T>,
  offset: number,
  def: T | null,
  over: Window<any>,
  filter?: IOperandable<boolean> | boolean
): IOperandable<T> {
  return new FunctionWindowCall('lead', filter ?? null, over, [value, offset ?? 1, def ?? null]) as IOperandable<T>
}
