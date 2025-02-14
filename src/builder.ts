import {AliasWrapper, ColumnWrapper, Operandable, UnnamedParameter} from './wrappers';
import {
  ColumnsBuilder,
  ColumnsList,
  ColumnsOrIndexesList,
  ColumnsOrIndexesOrOrderList,
  GroupByBuilder,
  HavingBuilder,
  IBuildableDeleteQuery,
  IBuildableInsertQuery,
  IBuildableQuery,
  IBuildableSelectQuery,
  IBuildableSubSelectQuery,
  IBuildableUpdateQuery,
  IBuildableUpsertQuery,
  IBuildableValuesPartial,
  IBuildableWherePartial,
  IDeleteBuilder,
  IFieldInfo,
  IIndexInfo,
  IInsertBuilder,
  IOperandable,
  ISelectBuilder,
  ITableInfo,
  ITableRef,
  IUpdateBuilder,
  IUpsertBuilder,
  JoinBuilder,
  OrderBuilder,
  SelectForOperation,
  TableMetaProvider,
  Values,
  ValuesBuilder,
  WhereBuilder,
} from './interfaces';
import {and} from './operators';
import {IAlias, IExpression, IOrderBy, IReference, IWindowDefinition} from "./intermediate";
import {TableMetadataSymbol} from "./symbols";

export interface IExpr {
  _alias?: string
  _column?: string
  _func?: string
  _args?: IExpr[]
  _operator?: string
  _operands?: IExpr[] | [IBuildableQuery]
}

function columnExpression(property: string, tableInfo: ITableInfo, ignoreTableName?: boolean, alias_?: string) {
  const info = tableInfo.fields.get(property);
  if (!info) {
    throw new Error(`Property ${property} should be decorated with @dbField`);
  }

  const {name = property, kind} = info;
  if (typeof kind === 'string' || typeof kind === 'symbol') {
    throw new Error(`@dbField kind specified by string or symbol is not support since 1.0.0`);
  }

  const tableName = alias_ ?? tableInfo.tableName;
  const ref = new ColumnWrapper({name, table: ignoreTableName ? undefined : tableName});
  if (typeof kind?.readQuery !== 'function') {
    return ref;
  }

  return new AliasWrapper(kind.readQuery(ref, proxy(tableInfo, ignoreTableName, alias_)), name);
}

function columnReference(property: string, tableInfo: ITableInfo, ignoreTableName?: boolean, alias?: string): IReference {
  if (typeof property === 'number') {
    return {_column: {name: property}};
  }

  const info = tableInfo.fields.get(property);
  if (!info) {
    throw new Error(`Property ${property} should be decorated with @dbField`);
  }

  const {name = property, kind} = info;
  if (typeof kind === 'string' || typeof kind === 'symbol') {
    throw new Error(`@dbField kind specified by string or symbol is not support since 1.0.0`);
  }

  const tableName = alias ?? tableInfo.tableName;
  return {_column: {name, table: ignoreTableName ? undefined : tableName}};
}

function proxy(meta: ITableInfo, ignoreTableName?: boolean, alias?: string): any {
  const {tableName: originalTableName, fields, primaryKey} = meta;
  return new Proxy({}, {
    get(_, property: string) {
      const tableName = alias ?? originalTableName;

      if (!fields.has(property)) {
        throw new Error(`Field '${property}' should be annotated with @dbField() or @dbManyField()`);
      }

      const {builder, relatedTo, name} = fields.get(property);
      if (!relatedTo && !builder) {
        return columnExpression(property, meta, ignoreTableName, alias);
      }

      if (!primaryKey) {
        throw new Error('@dbManyField() should be used on table with single field PK');
      }

      if (builder) {
        const pk: IOperandable<any> = new ColumnWrapper({table: tableName, name: primaryKey});
        const query: IBuildableSubSelectQuery = builder(pk, proxy(meta, ignoreTableName, alias));
        return new Operandable('SUBQUERY', [strip(query)]);
      }

      return new Operandable('SUBQUERY', [{
        _type: 'SELECT',
        _columns: [
          {_column: {table: relatedTo.tableName, name} }
        ],
        _table: {tableName: relatedTo.tableName, fields: null as any},
        _where: [
          {
            _operator: '=',
            _operands: [
              {_column: {table: relatedTo.tableName, name: relatedTo.keyField} },
              {_column: {table: tableName, name: primaryKey} }
            ]
          }
        ]
      } as IBuildableSubSelectQuery])
    }
  });
}

function treeOf<T>(_: Partial<T>, tableInfo: ITableInfo, alias?: string): IExpression {
  validateModel(_, tableInfo);
  return and(
    ...Object.keys(_)
      .map(field => columnExpression(field, tableInfo, false, alias).eq(_[field]))
  ) as never as IExpression;
}

function columnExpressionsOf<T>(_: ColumnsList<T>, tableInfo: ITableInfo, alias?: string): IExpression[] {
  const {fields} = tableInfo;
  for (const field of _) {
    if (!fields.has(field as string) || fields.get(field as string).relatedTo || fields.get(field as string).builder) {
      throw new Error(`Field '${field.toString()}' should be decorated with @dbField`);
    }
  }
  return _.map(field => columnExpression(field as string, tableInfo, false, alias) as never as IExpression);
}

function columnsOf<T>(_: ColumnsList<T>, tableInfo: ITableInfo, alias?: string): IReference[] {
  const {fields} = tableInfo;
  for (const field of _) {
    if (typeof field === 'number') {
      // skip indexes
      continue;
    }
    if (!fields.has(field as string) || fields.get(field as string).relatedTo || fields.get(field as string).builder) {
      throw new Error(`Field '${field.toString()}' should be decorated with @dbField`);
    }
  }
  return _.map(field => columnReference(field as string, tableInfo, false, alias));
}

function validateModel<T>(_: Values<T>, tableInfo: ITableInfo): void {
  validateFields(Object.keys(_), tableInfo);
}

function validateFields(_: string[], tableInfo: ITableInfo): void {
  _.forEach(prop => {
    if(!tableInfo.fields.has(prop)) {
      throw new Error(`Field '${prop}' should be annotated with @dbField() or @dbManyField()`);
    }
  });
}

function where<T>(this: IBuildableWherePartial, _: Partial<T> | WhereBuilder<T>) {
  const tree = typeof _ === 'function'
    ? (_ as WhereBuilder<T>)(proxy(this._table, false, this._alias))
    : treeOf(_, this._table, this._alias);
  this._where = this._where || [];
  this._where.push(tree);
  return this;
}

function having<T>(this: IBuildableSelectQuery, _: HavingBuilder<T>) {
  const tree = _(proxy(this._table, false, this._alias)) as any;
  this._having = this._having || [];
  this._having.push(tree);
  return this;
}

function columns<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | ColumnsBuilder<T>) {
  this._columns = (typeof _ === 'function'
    ? _(proxy(this._table, false, this._alias)) as IExpression[]
    : columnExpressionsOf(_, this._table, this._alias)).map(strip);
  return this;
}

function orderBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | OrderBuilder<T>) {
  this._orderBy = typeof _ === 'function'
    ? _(proxy(this._table, false, this._alias)) as IReference[]
    : columnsOf(_, this._table, this._alias);
  return this;
}

function groupBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | GroupByBuilder<T>) {
  this._groupBy = typeof _ === 'function'
    ?  _(proxy(this._table, false, this._alias)) as any as IReference[]
    : columnsOf(_, this._table, this._alias);
  return this;
}

function values<T>(this: IBuildableValuesPartial<T>, _: Values<T> | ValuesBuilder<T>) {
  const values: Values<T> = typeof _ === 'function'
    ? (_ as ValuesBuilder<T>)(proxy(this._table, false, this._alias))
    : {..._};

  validateModel(values, this._table);
  this._values = Object
    .keys(values)
    .filter(prop => this._table.fields.has(prop))
    .map(prop => this._table.fields.get(prop))
    .filter(({relatedTo, builder}) => relatedTo == null && builder == null)
    .reduce((p: Values<T>, {getValue, kind, name}: IFieldInfo) => {
      let value: any = getValue(values);

      if (kind) {
        if (typeof kind === 'string' || typeof kind === 'symbol') {
          throw new Error(`DbField specified by string or symbol is not support since 1.0.0`);
        }

        const {writer, writeQuery} = kind;
        if (typeof writer === 'function') {
          value = writer(value);
        }
        if (typeof writeQuery === 'function') {
          value = writeQuery(new UnnamedParameter(value), proxy(this._table, false, this._alias));
        }
      }
      return { ...p, [name]: value };
    }, {});

  return this;
}

function conflict<T>(this: IBuildableUpsertQuery, _?: string) {
  let _columns: string[] = [];
  let _where: any[] | undefined = undefined;

  if (!_) {
    if (!this._table.primaryKey) {
      throw new Error('Current table has no primary key. Please provide unique index for upsert');
    }
    this._table.fields.forEach((v) => {
      if (v.primaryKey) {
        _columns.push(v.name);
      }
    });
  } else {
    if (!this._table.indexes) {
      throw new Error('Table indexes meta is empty');
    }
    const index = this._table.indexes.find(i => i.name === _);
    if (!index) {
      throw new Error(`Index ${_} is not declared for table ${this._table.tableName}`);
    }

    validateFields(index.keyFields, this._table);
    _columns = index.keyFields.map(prop => this._table.fields.get(prop)?.name);

    if (index.where) {
      const tree = typeof index.where === 'function'
        ? (index.where as WhereBuilder<T>)(proxy(this._table, true, this._alias))
        : treeOf(index.where, this._table, this._alias);
      _where = [tree];
    }
  }
  this._conflictExp = { _columns, _where };
  return this;
}

function limit(this: IBuildableWherePartial, limit: number) {
  this._limit = limit;
  return this;
}

function offset(this: IBuildableSelectQuery, offset: number) {
  this._offset = offset;
  return this;
}

function parseJoinArgs<X extends TableMetaProvider>(...args: any[]): [X, ITableRef<X> | undefined, JoinBuilder<any, InstanceType<X>>] {
  if (args.length === 2) {
    args = [args[0], undefined, args[1]];
  }
  if (args.length === 3) {
    return args as any;
  }
  throw new Error('Expected 2 or 3 arguments, got ' + args.length);
}

function join<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function join<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function join<X extends TableMetaProvider>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins ?? [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'INNER',
    _condition: condition(proxy(this._table, false, this._alias), proxy(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinLeft<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinLeft<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinLeft<X extends TableMetaProvider>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins ?? [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'LEFT',
    _condition: condition(proxy(this._table, false, this._alias), proxy(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinRight<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinRight<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinRight<X extends TableMetaProvider>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins ?? [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'RIGHT',
    _condition: condition(proxy(this._table, false, this._alias), proxy(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinFull<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinFull<X extends TableMetaProvider>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinFull<X extends TableMetaProvider>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins ?? [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'FULL OUTER',
    _condition: condition(proxy(this._table, false, this._alias), proxy(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function union(this: IBuildableSelectQuery, operand: IBuildableSubSelectQuery);
function union(this: IBuildableSelectQuery, distinct: true, operand: IBuildableSubSelectQuery);
function union(this: IBuildableSelectQuery, ...args: any[]) {
  this._operators = this._operators ?? [];
  this._operators.push({
    _operator: 'UNION',
    _distinct: typeof args[0] === 'boolean' ? args.shift() : false,
    _operand: args.pop()
  })
  return this;
}

function intersect(this: IBuildableSelectQuery, operand: IBuildableSubSelectQuery);
function intersect(this: IBuildableSelectQuery, distinct: true, operand: IBuildableSubSelectQuery);
function intersect(this: IBuildableSelectQuery, ...args: any[]) {
  this._operators = this._operators ?? [];
  this._operators.push({
    _operator: 'INTERSECT',
    _distinct: typeof args[0] === 'boolean' ? args.shift() : false,
    _operand: args.pop()
  })
  return this;
}

function except(this: IBuildableSelectQuery, operand: IBuildableSubSelectQuery);
function except(this: IBuildableSelectQuery, distinct: true, operand: IBuildableSubSelectQuery);
function except(this: IBuildableSelectQuery, ...args: any[]) {
  this._operators = this._operators ?? [];
  this._operators.push({
    _operator: 'EXCEPT',
    _distinct: typeof args[0] === 'boolean' ? args.shift() : false,
    _operand: args.pop()
  })
  return this;
}

export class TableRef<T extends TableMetaProvider> implements ITableRef<T> {
  private readonly info: ITableInfo;
  private readonly alias: string;

  constructor(table: T) {
    this.info = readModelMeta(table);
    this.alias = `${this.info.tableName}_${Date.now().toString(36)}`;
  }

  public get tableName(): string {
    return this.alias;
  }
  public get originalTableName(): string {
    return this.info.tableName;
  }
  public get primaryKey(): string | undefined {
    return this.info.primaryKey;
  }
  public get fields(): Map<string, IFieldInfo> {
    return this.info.fields;
  }
  public get indexes(): IIndexInfo<T>[] {
    return this.info.indexes;
  }
}

export function readModelMeta<T extends TableMetaProvider>(Model: T, required = true): ITableInfo {
  if (Model[TableMetadataSymbol] == null && required) {
    throw new Error(`Model ${Model?.name ?? JSON.stringify(Model)} expected to be annotated with @dbTable`);
  }
  return Model[TableMetadataSymbol] ?? {};
}

function fix<T extends object>(x: T): T {
  if (TableMetadataSymbol in x) {
    Object.defineProperty(x, TableMetadataSymbol, {
      enumerable: false,
    })
  }

  for (const prop of Object.keys(x)) {
    if (typeof x[prop] === 'function') {
      Object.defineProperty(x, prop, {
        enumerable: false,
        configurable: false,
        writable: false,
      })
    }
  }
  return x;
}

function strip<T>(x: T): T {
  return Object.fromEntries(Object.entries(x).filter(([, value]) => typeof value !== 'function')) as never;
}

function computeReadableColumns(meta: ITableInfo, alias?: string) {
  if (!meta.fields) {
    return []
  }

  const keys = [...meta.fields.keys()]
  const fields = keys
    .filter(x => {
      const info = meta.fields.get(x) as IFieldInfo | null;
      return info && !info.builder && !info.relatedTo
    });

  return columnExpressionsOf(fields, meta, alias).map(strip)
}

const ContextSymbol = Symbol();

function isAlias(x: any): x is IAlias {
  return x && typeof x._alias === 'string';
}

function isSubquery(x: any): x is IBuildableSubSelectQuery {
  return x && typeof x._type === 'string' && x._type === 'SELECT';
}

export function Select<T extends TableMetaProvider>(_: IBuildableSelectQuery): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, distinct: true): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, forOp: SelectForOperation): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, forOp: SelectForOperation, distinct: true): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T> | IBuildableSelectQuery, ...args: unknown[]): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery {
  const forOr: SelectForOperation = typeof args[0] === 'string' ? args.shift() as any : undefined;
  const distinct: boolean = typeof args[0] === 'boolean' ? args.shift() as any : false;

  const meta = readModelMeta(isAlias(_) ? _._operands[0] : _);

  return fix({
    get [TableMetadataSymbol](): ITableInfo {
      const meta = {
        tableName: this._table.tableName + '_SUBQUERY',
        get fields() {
          return new Map<string, IFieldInfo>(this[ContextSymbol]._columns.map(x => {
            if ('_column' in x) {
              return [x._column.name, {
                name: x._column.name,
                getValue() { return null },
              }]
            } else if ('_alias' in x) {
              return [x._alias, {
                name: x._alias,
                getValue() { return null },
              }]
            }
          }).filter(x => x))
        }
      };

      Object.defineProperty(meta, ContextSymbol, {
        enumerable: false,
        value: this
      })

      return meta;
    },
    _type: 'SELECT',
    _table: isSubquery(_) ? {..._, ...meta} : meta,
    _alias: isAlias(_) ? _._alias : isSubquery(_) ? meta.tableName : null,
    _distinct: distinct,
    _for: forOr,
    _columns: computeReadableColumns(meta, isAlias(_) ? _._alias : undefined),
    columns,
    join,
    joinLeft,
    joinRight,
    joinFull,
    where,
    having,
    groupBy,
    orderBy,
    union,
    intersect,
    except,
    limit,
    offset,
    asScalar() {
      if (this._columns?.length !== 1) {
        throw new Error(`Scalar sub-query expects a single column`);
      }

      return new Operandable('SUBQUERY', [this]);
    }
  }) as IBuildableSelectQuery as any;
}

export function Insert<T extends TableMetaProvider>(_: T): IInsertBuilder<InstanceType<T>> & IBuildableInsertQuery {
  return fix({
    _type: 'INSERT',
    _table: readModelMeta(_),
    _columns: computeReadableColumns(readModelMeta(_)),
    values,
  }) as IBuildableInsertQuery as any;
}

export function Upsert<T extends TableMetaProvider>(_: T): IUpsertBuilder<InstanceType<T>> & IBuildableUpsertQuery {
  return fix({
    _type: 'UPSERT',
    _table: readModelMeta(_),
    _columns: computeReadableColumns(readModelMeta(_)),
    _limit: 1,
    values,
    where,
    limit,
    conflict
  }) as IBuildableUpsertQuery as any;
}

export function Update<T extends TableMetaProvider>(_: T): IUpdateBuilder<InstanceType<T>> & IBuildableUpdateQuery {
  return fix({
    _type: 'UPDATE',
    _table: readModelMeta(_),
    _columns: computeReadableColumns(readModelMeta(_)),
    values,
    where,
    limit,
  }) as IBuildableUpdateQuery as any;
}

export function Delete<T extends TableMetaProvider>(_: T): IDeleteBuilder<InstanceType<T>> & IBuildableDeleteQuery {
  return fix({
    _type: 'DELETE',
    _table: readModelMeta(_),
    _columns: computeReadableColumns(readModelMeta(_)),
    where,
    limit,
  }) as IBuildableDeleteQuery as any;
}

interface IFrameExclusionBuilder<T extends TableMetaProvider> {
  exclusion(exclude: 'CURRENT ROW' | 'GROUP' | 'TIES' | 'NO OTHERS'): Window<T>;
}

interface IFrameEndBuilder<T extends TableMetaProvider> {
  end(value: 'CURRENT ROW'): IFrameExclusionBuilder<T> & Window<T>
  end(offset: 'UNBOUNDED' | number, order: 'PRECEDING' | 'FOLLOWING'): IFrameExclusionBuilder<T> & Window<T>
}

interface IFrameStartBuilder<T extends TableMetaProvider> {
  start(value: 'CURRENT ROW'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
  start(offset: 'UNBOUNDED' | number, order: 'PRECEDING' | 'FOLLOWING'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
}

// noinspection JSUnusedLocalSymbols
export class Window<T extends TableMetaProvider> {
  private readonly _table: ITableInfo;
  private readonly _alias: string;

  private _groupBy?: IReference[]
  private _orderBy?: IOrderBy[]
  private _extends?: IWindowDefinition;
  private _mode?: 'RANGE' | 'ROWS' | 'GROUPS';
  private _start?: string;
  private _end?: string;
  private _exclusion?: 'CURRENT ROW' | 'GROUP' | 'TIES' | 'NO OTHERS';

  constructor(Model: T, extend?: Window<any>) {
    this._extends = extend as any;

    this._table = readModelMeta(isAlias(Model) ? Model._operands[0] : Model);
    this._alias = isAlias(Model) ? Model._alias : isSubquery(Model) ? this._table.tableName : null;
  }

  partitionBy(builder: GroupByBuilder<InstanceType<T>>): this;
  partitionBy(list: ColumnsOrIndexesList<InstanceType<T>>): this;
  partitionBy(x: unknown): this {
    groupBy.call(this, x);
    return this;
  }

  orderBy(builder: OrderBuilder<InstanceType<T>>): this;
  orderBy(list: ColumnsOrIndexesOrOrderList<InstanceType<T>>): this;
  orderBy(x: unknown): this {
    orderBy.call(this, x);
    return this;
  }

  range(): IFrameStartBuilder<T> {
    this._mode = 'RANGE';
    return this as any
  }

  rows(): IFrameStartBuilder<T> {
    this._mode = 'ROWS';
    return this as any
  }

  groups(): IFrameStartBuilder<T> {
    this._mode = 'GROUPS';
    return this as any
  }

  protected start(value: 'CURRENT ROW'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
  protected start(offset: 'UNBOUNDED' | number, order: 'PRECEDING' | 'FOLLOWING'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
  protected start(value: string | number, order?: string): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T> {
    this._start = [value, order].filter(x => x). join(' ');
    return this as any
  }

  protected end(value: 'CURRENT ROW'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
  protected end(offset: 'UNBOUNDED' | number, order: 'PRECEDING' | 'FOLLOWING'): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T>;
  protected end(value: string | number, order?: string): IFrameEndBuilder<T> & IFrameExclusionBuilder<T> & Window<T> {
    this._end = [value, order].filter(x => x). join(' ');
    return this as any
  }

  protected exclusion(exclude: 'CURRENT ROW' | 'GROUP' | 'TIES' | 'NO OTHERS'): Window<T> {
    this._exclusion = exclude;
    return this;
  }

  protected def(): IWindowDefinition {
    return {
      _extends: (this._extends as any)?.def(),
      _groupBy: this._groupBy,
      _orderBy: this._orderBy,
      _mode: this._mode,
      _start: this._start,
      _end: this._end,
      _exclusion: this._exclusion,
    }
  }
}
