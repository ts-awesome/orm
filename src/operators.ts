import {Column, IBuildableQuery, IOperandable, Order, TableMetaProvider, ITableRef} from "./interfaces";
import {ColumnWrapper, FunctionCall, Operandable} from "./wrappers";

export function and(...operands: (boolean | IOperandable<boolean>)[]): IOperandable<boolean> {
  return new Operandable('AND', operands) as IOperandable<boolean>
}

export function or(...operands: (boolean | IOperandable<boolean>)[]): IOperandable<boolean> {
  return new Operandable('OR', operands) as IOperandable<boolean>
}

export function not(condition: boolean | IOperandable<boolean>): IOperandable<boolean> {
  return new Operandable('NOT', [condition]) as IOperandable<boolean>
}

export function all<T=any>(subquery: IBuildableQuery): IOperandable<T> {
  return new Operandable('ALL', [subquery]) as IOperandable<T>
}

export function any<T=any>(subquery: IBuildableQuery): IOperandable<T> {
  return new Operandable('ANY', [subquery]) as IOperandable<T>
}

export function exists(subquery: IBuildableQuery): IOperandable<boolean> {
  return new Operandable('EXISTS', [subquery]) as IOperandable<boolean>
}

export function avg<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('AVG', [value]) as IOperandable<T>
}

export function sum<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('SUM', [value]) as IOperandable<T>
}

export function count<T>(value?: IOperandable<T>): IOperandable<number> {
  return new FunctionCall('COUNT', [value || '*']) as IOperandable<number>
}

export function max<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('MAX', [value]) as IOperandable<T>
}

export function min<T>(value: IOperandable<T>): IOperandable<T> {
  return new FunctionCall('MIN', [value]) as IOperandable<T>
}

export function asc<T>(value: Column<T>|IOperandable<T>): Order {
  return <any>{...(<any>value), _order: 'ASC',}
}

export function desc<T>(value: Column<T>|IOperandable<T>): Order {
  return <any>{...(<any>value), _order: 'DESC',}
}

export function of<X extends TableMetaProvider<X>, T=any>(_: X, field: keyof InstanceType<X>): IOperandable<T>;
export function of<X extends TableMetaProvider<X>, T=any>(_: ITableRef<X>, field: keyof InstanceType<X>): IOperandable<T>;
export function of<X extends TableMetaProvider<X>, T=any>(_: any, field: keyof InstanceType<X>): IOperandable<T> {
  const {tableName, fields} = _.prototype?.tableInfo ?? _;

  if (!fields.has(field)) {
    throw new Error(`Field '${field}' should be annotated with @dbField() or @dbManyField()`);
  }
  const {name} = fields.get(field)!;
  return (new ColumnWrapper(tableName + '.' + name)) as IOperandable<T>;
}

export function alias<T>(expr: T | IOperandable<T>, name: string): IOperandable<T> {
  return {_alias: name, _operands: [expr]} as any;
}
