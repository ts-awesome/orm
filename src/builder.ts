import {ColumnWrapper, Operandable} from "./wrappers";
import {
  ColumnsBuilder,
  ColumnsList,
  GroupByBuilder,
  HavingBuilder, IBuildableQuery,
  IBuildableSelectQuery,
  IBuildableSubSelectQuery,
  IBuildableValuesPartial,
  IBuildableWherePartial,
  IDeleteBuilder,
  IInsertBuilder,
  IOperandable,
  ISelectBuilder,
  ITableInfo,
  IUpdateBuilder, IUpsertBuilder,
  JoinBuilder,
  Optional,
  OrderBuilder,
  TableMetaProvider,
  ValuesBuilder,
  WhereBuilder
} from "./interfaces";
import {and} from "./operators";

export interface IExpr {
  _alias?: string
  _column?: string
  _func?: string
  _args?: IExpr[]
  _operator?: string
  _operands?: IExpr[] | [IBuildableQuery]
}

function proxy<T>({tableName, fields, primaryKey}: ITableInfo): any {
  return new Proxy({}, {
    get(_, property: string) {
      if (!fields.has(property)) {
        throw new Error(`Field "${property}" should be annotated with @dbField() or @dbManyField()`);
      }

      const {relatedTo, name} = fields.get(property)!;
      if (!relatedTo) {
        return new ColumnWrapper(`${tableName}.${name}`);
      }

      if (!primaryKey) {
        throw new Error('@dbManyField() should be used on table with single field PK');
      }

      return new Operandable('SUBQUERY', [{
        _type: 'SELECT',
        _columns: [
          {_column: `${relatedTo.tableName}.${name}`}
        ],
        _table: {tableName: relatedTo.tableName},
        _where: [
          {
            _operator: '=',
            _operands: [
              {_column: `${relatedTo.tableName}.${relatedTo.keyField}`},
              {_column: `${tableName}.${primaryKey}`}
            ]
          }
        ]
      } as IBuildableSubSelectQuery])
    }
  });
}

function treeOf<T>(_: Optional<T>, {tableName, fields}: ITableInfo): any {
  return and(
    ...Object.keys(_)
      .map(field => (new ColumnWrapper(prefix + field) as IOperandable<T>).eq(_[field]))
  );
}

function columnsOf<T>(_: ColumnsList<T>, {tableName, fields}: ITableInfo): any {
  _.forEach(field => {
    if (!fields.has(field as string) || fields.get(field as string)!.relatedTo) {
      throw new Error(`Field "${field}" should be decorated with @dbField()`)
    }
  });
  return _.map(field => ({_column: tableName + '.' + field}));
}

function where<T>(this: IBuildableWherePartial, _: Optional<T> | WhereBuilder<T>) {
  const tree = typeof _ === 'function'
    ? (_ as WhereBuilder<T>)(proxy<T>(this._table))
    : treeOf(_, this._table + '.');
  this._where = this._where || [];
  this._where.push(tree);
  return this;
}

function having<T>(this: IBuildableSelectQuery, _: HavingBuilder<T>) {
  const tree = _(proxy<T>(this._table));
  this._having = this._having || [];
  this._having.push(tree);
  return this;
}

function columns<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | ColumnsBuilder<T>) {
  this._columns = typeof _ === 'function'
    ? _(proxy<T>(this._table))
    : columnsOf(_, this._table);
  return this;
}

function orderBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | OrderBuilder<T>) {
  this._orderBy = typeof _ === 'function'
    ? _(proxy<T>(this._table))
    : columnsOf(_, this._table);
  return this;
}

function groupBy<T>(this: IBuildableSelectQuery, _: ColumnsList<T> | GroupByBuilder<T>) {
  this._groupBy = typeof _ === 'function'
    ?  _(proxy<T>(this._table))
    : columnsOf(_, this._table);
  return this;
}

function values<T>(this: IBuildableValuesPartial, _: Optional<T> | ValuesBuilder<T>) {
  this._values = typeof _ === 'function' ? (_ as ValuesBuilder<T>)(proxy<T>(this._table)) : _;
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

function join<X extends TableMetaProvider<InstanceType<X>>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>) {
  this._joins = this._joins || [];
  const table = (<any>_).prototype.tableInfo;
  this._joins.push({
    _table: table.tableName,
    _type: 'INNER',
    _condition: condition(proxy<X>(this._table), proxy<X>(table))
  });
  return this;
}

function joinLeft<X extends TableMetaProvider<InstanceType<X>>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>) {
  this._joins = this._joins || [];
  const table = (<any>_).prototype.tableInfo;
  this._joins.push({
    _table: table.tableName,
    _type: 'LEFT',
    _condition: condition(proxy<X>(this._table), proxy<X>(table))
  });
  return this;
}

function joinRight<X extends TableMetaProvider<InstanceType<X>>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>) {
  this._joins = this._joins || [];
  const table = (<any>_).prototype.tableInfo;
  this._joins.push({
    _table: table.tableName,
    _type: 'RIGHT',
    _condition: condition(proxy<X>(this._table), proxy<X>(table))
  });
  return this;
}

function joinFull<X extends TableMetaProvider<InstanceType<X>>>(this: IBuildableSelectQuery, _: X, condition: JoinBuilder<any, InstanceType<X>>) {
  this._joins = this._joins || [];
  const table = (<any>_).prototype.tableInfo;
  this._joins.push({
    _table: table.tableName,
    _type: 'FULL OUTER',
    _condition: condition(proxy<X>(this._table), proxy<X>(table))
  });
  return this;
}

export function Select<T extends TableMetaProvider<InstanceType<T>>>(_: T): ISelectBuilder<T> {
  return {
    _type: 'SELECT',
    _table: (<any>_).prototype.tableInfo,
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
  } as any;
}

export function Insert<T extends TableMetaProvider<InstanceType<T>>>(_: T): IInsertBuilder<InstanceType<T>> {
  return {
    _type: 'INSERT',
    _table: (<any>_).prototype.tableInfo,
    values,
  } as any;
}

export function Upsert<T extends TableMetaProvider<InstanceType<T>>>(_: T): IUpsertBuilder<InstanceType<T>> {
  return {
    _type: 'UPSERT',
    _table: (<any>_).prototype.tableInfo,
    _limit: 1,
    values,
    where,
    limit,
  } as any;
}

export function Update<T extends TableMetaProvider<InstanceType<T>>>(_: T): IUpdateBuilder<InstanceType<T>> {
  return {
    _type: 'UPDATE',
    _table: (<any>_).prototype.tableInfo,
    values,
    where,
    limit,
  } as any;
}

export function Delete<T extends TableMetaProvider<InstanceType<T>>>(_: T): IDeleteBuilder<InstanceType<T>> {
  return {
    _type: 'DELETE',
    _table: (<any>_).prototype.tableInfo,
    where,
    limit,
  } as any;
}
