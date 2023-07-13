import { IExpression, IJoin, IOrderBy, IReference } from './intermediate';
import {NamedParameter, Operandable} from "./wrappers";

export type DbValueType = string | number | boolean | Date | null | undefined;

export interface IDbField<T = any, X = any> {
  readQuery?(reference: IOperandable, table: Queryable<X>): IOperandable;
  writeQuery?(value: IOperandable, table: Queryable<X>): IOperandable;
  reader?(raw: DbValueType): T;
  writer?(value: T): DbValueType;
}

export interface SubQueryBuilder<T=number> {
  (value: Operandable<T>, table: Queryable<T>): IBuildableSubSelectQuery
}

declare type Class = new (...args: any) => any;
export interface IFieldInfo {
  primaryKey?: true;
  autoIncrement?: true;
  name: string;
  readonly?: true;
  relatedTo?: {
    tableName: string;
    keyField: string;
  };
  builder?: SubQueryBuilder<any>;
  sensitive?: true;
  default?: DbValueType;
  kind?: IDbField;
  nullable?: true;
  model?: Class | [Class];
  getValue(x: any): DbValueType;
}

export interface IIndexInfo<T extends TableMetaProvider> {
  name: string;
  keyFields: string[];
  where?: WhereBuilder<T>;
  default: boolean;
}

export interface ITableInfo {
  tableName: string;
  primaryKey?: string;
  fields: Map<string, IFieldInfo>;
  indexes?: IIndexInfo<any>[];
}

export type TableMetaProvider<T = any> = new (...args: any) => T;

export type Queryable<T> = {
  readonly [P in keyof T]: IOperandable<T[P]>;
}

export type Values<T> = {
  [P in keyof T]?: IOperandable<T[P]> | T[P];
}

export type ColumnsList<T> = Column<T>[];

export interface IOperandable<T=any> {
  eq(value: T | IOperandable<T>): boolean;
  neq(value: T | IOperandable<T>): boolean;
}

export interface IOperandable<T=any> {
  gt(value: T | IOperandable<T>): boolean;
  gte(value: T | IOperandable<T>): boolean;
  lt(value: T | IOperandable<T>): boolean;
  lte(value: T | IOperandable<T>): boolean;
  between(min: T | IOperandable<T>, max: T | IOperandable<T>): boolean;
}

export type ElementType<T> = T extends any[] ? T[number] : T;
export interface IOperandable<T> {
  in(value: T[] | Iterable<T> | IOperandable<T[]>): boolean;
  has(value: ElementType<T> | IOperandable<ElementType<T>>): boolean
}

export interface IOperandable {
  like(value: string): boolean;
}

export interface IOperandable<T=any> {
  add(value: T | IOperandable<T>): IOperandable<T>;
  sub(value: T | IOperandable<T>): IOperandable<T>;
  mul(value: T | IOperandable<T>): IOperandable<T>;
  div(value: T | IOperandable<T>): IOperandable<T>;
  mod(value: T | IOperandable<T>): IOperandable<T>;
}

export interface IOperandable<T=any> {
  and(value: T | IOperandable<T>): IOperandable<T>;
  or(value: T | IOperandable<T>): IOperandable<T>;
  xor(value: T | IOperandable<T>): IOperandable<T>;
}

export type WhereBuilder<T> = (model: Queryable<T>) => IOperandable<boolean> | boolean;
export type HavingBuilder<T> = (model: Queryable<T>) => IOperandable<boolean> | boolean;
export type ValuesBuilder<T> = (model: Queryable<T>) => Values<T>;
export type JoinBuilder<T, X> = (root: Queryable<T>, other: Queryable<X>) => IOperandable<boolean> | boolean;
export type OrderBuilder<T> = (x: Columns<T>) => (Column<T>|Order|IOperandable<any>)[];
export type GroupByBuilder<T> = (x: Columns<T>) => Column<T>[];
export type ColumnsBuilder<T> = (x: Queryable<T>) => (Column<T>|IOperandable<any>)[];

export type Column<T> = keyof T;
export type Columns<T> = {
  readonly [P in keyof T]: Column<T>;
}

export interface Order {}

export interface IBuildableWherePartial {
  _table: ITableInfo
  _alias?: string
  _where?: any[]
  _limit?: number
}

export interface IBuildableValuesPartial<T> {
  _table: ITableInfo
  _alias?: string
  _values?: Values<T>
}

export type SelectForOperation = 'UPDATE' | 'NO KEY UPDATE' | 'SHARE' | 'KEY SHARE';
export interface IBuildableSelectQuery {
  _type: 'SELECT'
  _table: ITableInfo
  _alias?: string
  _distinct?: boolean
  _for?: SelectForOperation
  _columns?: IExpression[]
  _joins?: IJoin[]
  _where?: IExpression[]
  _groupBy?: IReference[]
  _having?: IExpression[]
  _orderBy?: IOrderBy[]
  _limit?: number
  _offset?: number
}

export interface IBuildableSubSelectQuery {
  _type: 'SELECT'
  _table: ITableInfo
  _alias?: string
  _distinct?: boolean
  _columns?: IExpression[]
  _joins?: IJoin[]
  _where?: IExpression[]
  _groupBy?: IReference[]
  _having?: IExpression[]
}

export interface IBuildableInsertQuery {
  _type: 'INSERT'
  _table: ITableInfo
  _columns?: IExpression[]
  _values?: any
}

export interface IBuildableUpsertQuery {
  _type: 'UPSERT'
  _table: ITableInfo
  _columns?: IExpression[]
  _alias?: string
  _values?: any
  _where?: IExpression[]
  _conflictExp?: {
    _columns: string[],
    _where?: any[]
  },
}

export interface IBuildableUpdateQuery {
  _type: 'UPDATE'
  _table: ITableInfo
  _columns?: IExpression[]
  _values?: any
  _where?: IExpression[]
  _limit?: number
}

export interface IBuildableDeleteQuery {
  _type: 'DELETE'
  _table: ITableInfo
  _columns?: IExpression[]
  _where?: IExpression[]
  _limit?: number
}

export type IBuildableQuery = IBuildableSelectQuery | IBuildableInsertQuery | IBuildableUpsertQuery | IBuildableUpdateQuery | IBuildableDeleteQuery

export interface IWhereHandler<T> {
  where(builder: WhereBuilder<T>): this
  where(value: Partial<T>): this
  limit(limit: number): this
}

export interface IValuesHandler<T> {
  values(builder: ValuesBuilder<T>): this
  values(values: Partial<T>): this
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ITableRef<T extends TableMetaProvider> extends ITableInfo {
  readonly originalTableName: string;
}

export interface ISelectBuilder<T> extends IWhereHandler<T> {
  columns(builder: ColumnsBuilder<T>): this
  columns(list: ColumnsList<T>): this
  groupBy(builder: GroupByBuilder<T>): this
  groupBy(list: ColumnsList<T>): this
  orderBy(builder: OrderBuilder<T>): this
  orderBy(list: ColumnsList<T>): this
  having(builder: HavingBuilder<T>): this
  join<X extends TableMetaProvider>(Model: X, on: JoinBuilder<T, InstanceType<X>>): this
  join<X extends TableMetaProvider>(Model: X, alias: ITableRef<X>, on: JoinBuilder<T, InstanceType<X>>): this
  joinLeft<X extends TableMetaProvider>(Model: X, on: JoinBuilder<T, InstanceType<X>>): this
  joinLeft<X extends TableMetaProvider>(Model: X, alias: ITableRef<X>, on: JoinBuilder<T, InstanceType<X>>): this
  joinRight<X extends TableMetaProvider>(Model: X, on: JoinBuilder<T, InstanceType<X>>): this
  joinRight<X extends TableMetaProvider>(Model: X, alias: ITableRef<X>, on: JoinBuilder<T, InstanceType<X>>): this
  joinFull<X extends TableMetaProvider>(Model: X, on: JoinBuilder<T, InstanceType<X>>): this
  joinFull<X extends TableMetaProvider>(Model: X, alias: ITableRef<X>, on: JoinBuilder<T, InstanceType<X>>): this
  offset(offset: number): this

  // from IWhereHandler<T> to ensure WebStorm resolves types correctly
  where(builder: WhereBuilder<T>): this
  where(value: Partial<T>): this
  limit(limit: number): this

  asScalar<T = number>(): IOperandable<T>
}

export interface IInsertBuilder<T> extends IValuesHandler<T> {}

export interface IUpsertBuilder<T> extends IValuesHandler<T>, IWhereHandler<T> {
  conflict(index?: string): this
}
export interface IUpdateBuilder<T> extends IValuesHandler<T>, IWhereHandler<T> {}
export interface IDeleteBuilder<T> extends IWhereHandler<T> {}

export interface IBuildableQueryCompiler<T> {
  compile(query: IBuildableQuery): T
}

export type IQueryData = { [key: string]: DbValueType }

export interface WithParams {
  params?: {
    [key: string]: DbValueType;
  };
}


export interface IQueryExecutor<T, R = IQueryData> {
  execute(query: T & WithParams): Promise<ReadonlyArray<R>>;
  execute(query: T & WithParams, scalar: true): Promise<number>;
  execute<X extends TableMetaProvider>(query: T & WithParams, Model: X, sensitive?: boolean): Promise<ReadonlyArray<InstanceType<X>>>;

  readonly namedParameters: Readonly<Record<string, DbValueType>>;
  setNamedParameter<T extends DbValueType>(param: NamedParameter<T>, value: T): void;
  removeNamedParameter(param: NamedParameter<unknown>): void;
}

// noinspection JSUnusedGlobalSymbols
export const enum IsolationLevel {
  Serializable = 'SERIALIZABLE',
  RepeatableRead = 'REPEATABLE READ',
  ReadCommitted = 'READ COMMITTED',
  ReadUncommitted = 'READ UNCOMMITTED',
}

export interface ITransaction<TQuery, R = IQueryData, IL = IsolationLevel> extends IQueryExecutor<TQuery, R> {
  readonly finished: boolean;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  setIsolationLevel(isolationLevel: IL): Promise<void>;
}

export interface IQueryDriver<TQuery, R = IQueryData, IL = IsolationLevel> extends IQueryExecutor<TQuery, R> {
  begin(isolationLevel?: IL): Promise<ITransaction<TQuery, R, IL>>;
  end(): Promise<void>;
}

export interface IQueryExecutorProvider<TQuery> {
  getExecutor(): IQueryExecutor<TQuery>;
}
