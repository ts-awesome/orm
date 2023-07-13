import {AliasWrapper, ColumnWrapper, Operandable, UnnamedParameter} from './wrappers';
import {
  ColumnsBuilder,
  ColumnsList,
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
  OrderBuilder, SelectForOperation,
  TableMetaProvider,
  ValuesBuilder,
  WhereBuilder,
} from './interfaces';
import {and} from './operators';
import {IAlias, IExpression, IReference} from "./intermediate";
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
    if (!fields.has(field as string) || fields.get(field as string).relatedTo || fields.get(field as string).builder) {
      throw new Error(`Field '${field.toString()}' should be decorated with @dbField`);
    }
  }
  return _.map(field => columnReference(field as string, tableInfo, false, alias));
}

function validateModel<T>(_: Partial<T>, tableInfo: ITableInfo): void {
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
  this._columns = typeof _ === 'function'
    ? _(proxy(this._table, false, this._alias)) as IExpression[]
    : columnExpressionsOf(_, this._table, this._alias);
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

function values<T>(this: IBuildableValuesPartial<T>, _: Partial<T> | ValuesBuilder<T>) {
  if (typeof _ === 'function') {
    this._values = (_ as ValuesBuilder<T>)(proxy(this._table, false, this._alias));
  } else {
    validateModel(_, this._table);
    this._values = Object
      .keys(_)
      .filter(prop => this._table.fields.has(prop))
      .map(prop => this._table.fields.get(prop))
      .filter(({relatedTo, builder}) => relatedTo == null && builder == null)
      .reduce((p: any, {getValue, kind, name}: IFieldInfo) => {
        let value: any = getValue(_);

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
  }
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

  this._joins = this._joins || [];
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

  this._joins = this._joins || [];
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

  this._joins = this._joins || [];
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

  this._joins = this._joins || [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'FULL OUTER',
    _condition: condition(proxy(this._table, false, this._alias), proxy(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

export class TableRef<T extends TableMetaProvider> implements ITableRef<T> {
  private readonly info: ITableInfo;
  private readonly alias: string;

  constructor(private table: T) {
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

function fix<T>(x: T): T {
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
      return info && !info.sensitive && !info.builder && !info.relatedTo
    });

  return columnExpressionsOf(fields, meta, alias)
}


export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, distinct: true): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, forOp: SelectForOperation): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, forOp: SelectForOperation, distinct: true): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery;
export function Select<T extends TableMetaProvider>(_: T | IOperandable<T>, ...args: unknown[]): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery {
  function isAlias(x: any): x is IAlias {
    return x && typeof x._alias === 'string';
  }

  const forOr: SelectForOperation = typeof args[0] === 'string' ? args.shift() as any : undefined;
  const distinct: boolean = typeof args[0] === 'boolean' ? args.shift() as any : false;

  const meta = readModelMeta(isAlias(_) ? _._operands[0] : _);

  return fix({
    _type: 'SELECT',
    _table: meta,
    _alias: isAlias(_) ? _._alias : null,
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
