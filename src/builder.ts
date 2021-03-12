import {ColumnWrapper, Operandable} from './wrappers';
import {
  ColumnsBuilder,
  ColumnsList,
  GroupByBuilder,
  HavingBuilder,
  IBuildableQuery,
  IBuildableSelectQuery,
  IBuildableSubSelectQuery,
  IBuildableValuesPartial,
  IBuildableWherePartial,
  IDeleteBuilder,
  IInsertBuilder,
  IOperandable,
  ISelectBuilder,
  ITableInfo,
  IUpdateBuilder,
  IUpsertBuilder,
  JoinBuilder,
  OrderBuilder,
  TableMetaProvider,
  ValuesBuilder,
  WhereBuilder,
  IFieldInfo,
  IBuildableUpsertQuery,
  ITableRef, IBuildableDeleteQuery, IBuildableUpdateQuery, IBuildableInsertQuery,
} from './interfaces';
import {and} from './operators';
import {IColumnRef, IExpression, IReference} from "./intermediate";
import {TableMetadataSymbol} from "./symbols";

export interface IExpr {
  _alias?: string
  _column?: string
  _func?: string
  _args?: IExpr[]
  _operator?: string
  _operands?: IExpr[] | [IBuildableQuery]
}

function proxy<T>({tableName: originalTableName, fields, primaryKey}: ITableInfo, ignoreTableName?: boolean, alias?: string): any {
  return new Proxy({}, {
    get(_, property: string) {
      const tableName = alias ?? originalTableName;

      if (!fields.has(property)) {
        throw new Error(`Field '${property}' should be annotated with @dbField() or @dbManyField()`);
      }

      const {relatedTo, name} = fields.get(property)!;
      if (!relatedTo) {
        const ref = resolveColumn(property, {tableName, fields})
        if (ignoreTableName) {
          ref.table = undefined;
        }
        return new ColumnWrapper(ref);
      }

      if (!primaryKey) {
        throw new Error('@dbManyField() should be used on table with single field PK');
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

function treeOf<T>(_: Partial<T>, tableInfo: ITableInfo): any {
  validateModel(_, tableInfo);
  return and(
    ...Object.keys(_)
      .map(field => (new ColumnWrapper(resolveColumn(field as string, tableInfo)) as IOperandable<T>).eq(_[field]))
  );
}

function columnsOf<T>(_: ColumnsList<T>, {tableName, fields}: ITableInfo): IReference[] {
  _.forEach(field => {
    if (!fields.has(field as string) || fields.get(field as string)!.relatedTo) {
      throw new Error(`Field '${field}' should be decorated with @dbField`)
    }
  });
  return _.map(field => ({_column: resolveColumn(field as string, {tableName, fields})}));
}

function resolveColumn(property: string, {tableName, fields}: ITableInfo): IColumnRef {

  const info = fields.get(property);
  if (!info) {
    throw new Error(`Property ${property} should be decorated with @dbField`);
  }

  const {name = property, kind} = info;
  if (typeof kind === 'string' || typeof kind === 'symbol') {
    throw new Error(`@dbField kind specified by string or symbol is not support since 1.0.0`);
  }

  return {
    table: tableName,
    name,
    wrapper: kind?.readQuery,
  }
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
    ? (_ as WhereBuilder<T>)(proxy<T>(this._table))
    : treeOf(_, this._table);
  this._where = this._where || [];
  this._where.push(tree);
  return this;
}

function having<T>(this: IBuildableSelectQuery, _: HavingBuilder<T>) {
  const tree = _(proxy<T>(this._table)) as any;
  this._having = this._having || [];
  this._having.push(tree);
  return this;
}

function columns<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | ColumnsBuilder<T>) {
  this._columns = typeof _ === 'function'
    ? _(proxy<T>(this._table)) as IExpression[]
    : columnsOf(_, this._table);
  return this;
}

function orderBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | OrderBuilder<T>) {
  this._orderBy = typeof _ === 'function'
    ? _(proxy<T>(this._table)) as IReference[]
    : columnsOf(_, this._table);
  return this;
}

function groupBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | GroupByBuilder<T>) {
  this._groupBy = typeof _ === 'function'
    ?  _(proxy<T>(this._table)) as any as IReference[]
    : columnsOf(_, this._table);
  return this;
}

function values<T>(this: IBuildableValuesPartial, _: Partial<T> | ValuesBuilder<T>) {
  if (typeof _ === 'function') {
    this._values = (_ as ValuesBuilder<T>)(proxy<T>(this._table));
  } else {
    validateModel(_, this._table);
    this._values = Object
      .keys(_)
      .map(prop => this._table.fields.get(prop)!)
      .reduce((p: any, {getValue, kind, name}: IFieldInfo) => {
        let value = getValue(_);
        let wrapper: any = undefined;

        if (kind) {
          if (typeof kind === 'string' || typeof kind === 'symbol') {
            throw new Error(`DbField specified by string or symbol is not support since 1.0.0`);
          }
          wrapper = kind.writeQuery;

          const {writer = (x: any) => x} = kind;
          value = writer(value);
        }
        return { ...p, [name]: {value, wrapper} };
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
    _columns = index.keyFields.map(prop => this._table.fields.get(prop)!.name);

    if (index.where) {
      const tree = typeof index.where === 'function'
        ? (index.where as WhereBuilder<T>)(proxy<T>(this._table, true))
        : treeOf(index.where, this._table);
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

function parseJoinArgs<X extends TableMetaProvider<X>>(...args: any[]): [X, ITableRef<X> | undefined, JoinBuilder<any, InstanceType<X>>] {
  if (args.length === 2) {
    args = [args[0], undefined, args[1]];
  }
  if (args.length === 3) {
    return args as any;
  }
  throw new Error('Expected 2 or 3 arguments, got ' + args.length);
}

function join<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function join<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function join<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins || [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'INNER',
    _condition: condition(proxy<X>(this._table), proxy<X>(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinLeft<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinLeft<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinLeft<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins || [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'LEFT',
    _condition: condition(proxy<X>(this._table), proxy<X>(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinRight<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinRight<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinRight<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins || [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'RIGHT',
    _condition: condition(proxy<X>(this._table), proxy<X>(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

function joinFull<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>);
function joinFull<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, _: X, alias: ITableRef<X>, condition: JoinBuilder<any, InstanceType<X>>);
function joinFull<X extends TableMetaProvider<X>>(this: IBuildableSelectQuery, ...args: any[]) {
  const [_, alias, condition] = parseJoinArgs<X>(...args);

  this._joins = this._joins || [];
  const table = readModelMeta(_);
  this._joins.push({
    _tableName: table.tableName,
    _alias: alias?.tableName,
    _type: 'FULL OUTER',
    _condition: condition(proxy<X>(this._table), proxy<X>(table, undefined, alias?.tableName)) as any,
  });
  return this;
}

export class TableRef<T extends TableMetaProvider<T>> implements ITableRef<T> {
  private readonly info: ITableInfo;
  private readonly alias: string;

  constructor(private table: any) {
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
  public get fields() {
    return this.info.fields;
  }
  public get indexes() {
    return this.info.indexes;
  }
}

export function readModelMeta(Model: any): ITableInfo {
  if (Model[TableMetadataSymbol] == null) {
    throw new Error(`Model ${Model?.name ?? JSON.stringify(Model)} expected to be annotated with @dbTable`);
  }
  return Model[TableMetadataSymbol] ?? {};
}

export function Select<T extends TableMetaProvider<T>>(_: T, distinct = false): ISelectBuilder<InstanceType<T>> & IBuildableSelectQuery {
  return {
    _type: 'SELECT',
    _table: readModelMeta(_),
    _distinct: distinct,
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
  } as IBuildableSelectQuery as any;
}

export function Insert<T extends TableMetaProvider<T>>(_: T): IInsertBuilder<InstanceType<T>> & IBuildableInsertQuery {
  return {
    _type: 'INSERT',
    _table: readModelMeta(_),
    values,
  } as IBuildableInsertQuery as any;
}

export function Upsert<T extends TableMetaProvider<T>>(_: T): IUpsertBuilder<InstanceType<T>> & IBuildableUpsertQuery {
  return {
    _type: 'UPSERT',
    _table: readModelMeta(_),
    _limit: 1,
    values,
    where,
    limit,
    conflict
  } as IBuildableUpsertQuery as any;
}

export function Update<T extends TableMetaProvider<T>>(_: T): IUpdateBuilder<InstanceType<T>> & IBuildableUpdateQuery {
  return {
    _type: 'UPDATE',
    _table: readModelMeta(_),
    values,
    where,
    limit,
  } as IBuildableUpdateQuery as any;
}

export function Delete<T extends TableMetaProvider<T>>(_: T): IDeleteBuilder<InstanceType<T>> & IBuildableDeleteQuery {
  return {
    _type: 'DELETE',
    _table: readModelMeta(_),
    where,
    limit,
  } as IBuildableDeleteQuery as any;
}
