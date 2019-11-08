export type DbValueType = string | number | boolean | Date | null | undefined;

export interface IDbField<T = any> {
  readQuery?(name: string): string;
  writeQuery?(name: string): string;
  reader?(raw: DbValueType): T;
  writer?(value: T): DbValueType;
}

export interface IFieldInfo {
  primaryKey?: true;
  autoIncrement?: true;
  name: string;
  readonly?: true;
  relatedTo?: {
    tableName: string;
    keyField: string;
  };
  sensitive?: true;
  defaults?: DbValueType;
  kind?: IDbField | 'uuid' | 'json' | string | symbol;

  getValue(rec: any): DbValueType;
}

export interface IIndexInfo<T> {
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

export type TableMetaProvider<T> = {
  new (...args: any[]): T
  prototype: {
    [P in keyof T]: any | any[] | null | undefined
  }
}

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

type ElementType<T> = T extends any[] ? T[number] : T;
export interface IOperandable<T> {
  in(value: T[] | IOperandable<T[]>): boolean;
  has(value: ElementType<T> | IOperandable<ElementType<T>>): boolean
}

export interface IOperandable<T=any> {
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
export type JoinBuilder<T,X> = (root: Queryable<T>, other: Queryable<X>) => IOperandable<boolean> | boolean;
export type OrderBuilder<T> = (x: Columns<T>) => (Column<T>|Order|IOperandable<any>)[];
export type GroupByBuilder<T> = (x: Columns<T>) => Column<T>[];
export type ColumnsBuilder<T> = (x: Queryable<T>) => (Column<T>|IOperandable<any>)[];

export type Column<T> = keyof T;
export type Columns<T> = {
  readonly [P in keyof T]: Column<T>;
}

export interface Order {}

export interface IContainer {
  get<T>(serviceIdentifier: string | symbol): T;
  getTagged<T>(serviceIdentifier: string | symbol, key: string | number | symbol, value: any): T;
  getNamed<T>(serviceIdentifier: string | symbol, named: string | number | symbol): T;
  getAll<T>(serviceIdentifier: string | symbol): T[];
  getAllTagged<T>(serviceIdentifier: string | symbol, key: string | number | symbol, value: any): T[];
  getAllNamed<T>(serviceIdentifier: string | symbol, named: string | number | symbol): T[];
}

export interface IBuildableWherePartial {
  _table: ITableInfo
  _kernel?: IContainer
  _where?: any[]
  _limit?: number
}

export interface IBuildableValuesPartial {
  _table: ITableInfo
  _kernel?: IContainer
  _values?: any
}

interface IBuildableSelectQuery {
  _type: 'SELECT'
  _table: ITableInfo
  _kernel?: IContainer
  _columns?: any[]
  _joins?: any[]
  _where?: any[]
  _groupBy?: any[]
  _having?: any[]
  _orderBy?: any[]
  _limit?: number
  _offset?: number
}

export interface IBuildableSubSelectQuery {
  _type: 'SELECT'
  _table: ITableInfo
  _kernel?: IContainer
  _columns?: any[]
  _joins?: any[]
  _where?: any[]
  _groupBy?: any[]
  _having?: any[]
}

interface IBuildableInsertQuery {
  _type: 'INSERT'
  _table: ITableInfo
  _kernel?: IContainer
  _values?: any
}

interface IBuildableUpsertQuery {
  _type: 'UPSERT'
  _table: ITableInfo
  _kernel?: IContainer
  _values?: any
  _where?: any[],
  _conflictExp?: {
    _columns: string[],
    _where?: any[]
  },
}

interface IBuildableUpdateQuery {
  _type: 'UPDATE'
  _table: ITableInfo
  _kernel?: IContainer
  _values?: any
  _where?: any[]
  _limit?: number
}

interface IBuildableDeleteQuery {
  _type: 'DELETE'
  _table: ITableInfo
  _kernel?: IContainer
  _where?: any[]
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

export interface ISelectBuilder<T extends TableMetaProvider<InstanceType<T>>> extends IWhereHandler<InstanceType<T>>, IBuildableSelectQuery {
  columns(builder: ColumnsBuilder<InstanceType<T>>): this
  columns(list: ColumnsList<InstanceType<T>>): this
  groupBy(builder: GroupByBuilder<InstanceType<T>>): this
  groupBy(list: ColumnsList<InstanceType<T>>): this
  orderBy(builder: OrderBuilder<InstanceType<T>>): this
  orderBy(list: ColumnsList<InstanceType<T>>): this
  having(builder: HavingBuilder<InstanceType<T>>): this
  join<X extends TableMetaProvider<InstanceType<X>>>(Model: X, on: JoinBuilder<InstanceType<T>, InstanceType<X>>): this
  joinLeft<X extends TableMetaProvider<InstanceType<X>>>(Model: X, on: JoinBuilder<InstanceType<T>, InstanceType<X>>): this
  joinRight<X extends TableMetaProvider<InstanceType<X>>>(Model: X, on: JoinBuilder<InstanceType<T>, InstanceType<X>>): this
  joinFull<X extends TableMetaProvider<InstanceType<X>>>(Model: X, on: JoinBuilder<InstanceType<T>, InstanceType<X>>): this
  offset(offset: number): this
}

export interface IInsertBuilder<T> extends IValuesHandler<T>, IBuildableInsertQuery {}

export interface IUpsertBuilder<T> extends IValuesHandler<T>, IWhereHandler<T>, IBuildableUpsertQuery {
  conflict(_?: string): this
}
export interface IUpdateBuilder<T> extends IValuesHandler<T>, IWhereHandler<T>, IBuildableUpdateQuery {}
export interface IDeleteBuilder<T> extends IWhereHandler<T>, IBuildableDeleteQuery {}

export interface IBuildableQueryCompiler<T> {
  compile(query: IBuildableQuery): T
}

export type ICountData = { [key: string]: number};
export type IQueryData = {[key: string]: DbValueType}

export interface IQueryExecutor<T> {
  execute(sqlQuery: T): Promise<IQueryData[]>;
}

export interface IDbDataReader<T> {
  readOne(data: IQueryData[]): T | undefined;
  readOneOrRejectNotFound(data: IQueryData[]): T;
  readMany(data: IQueryData[]): T[];
  readManyOrRejectNotFound(dbResult: IQueryData[]): T[];
  readCount(data: ICountData[]): number;
}

export interface ISqlTransaction<TQuery> extends IQueryExecutor<TQuery> {
  readonly finished: boolean;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface ISqlDataDriver<TQuery> extends IQueryExecutor<TQuery> {
  begin(): Promise<ISqlTransaction<TQuery>>;
  end(): Promise<void>;
}
