import {ColumnWrapper, Operandable} from './wrappers';
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
  WhereBuilder,
  IFieldInfo,
  IBuildableUpsertQuery,
  Column,
} from './interfaces';
import {and} from './operators';

export interface IExpr {
  _alias?: string
  _column?: string
  _func?: string
  _args?: IExpr[]
  _operator?: string
  _operands?: IExpr[] | [IBuildableQuery]
}

function proxy<T>({tableName, fields, primaryKey}: ITableInfo, ignoreTableName?: boolean): any {
  return new Proxy({}, {
    get(_, property: string) {
      if (!fields.has(property)) {
        throw new Error(`Field '${property}' should be annotated with @dbField() or @dbManyField()`);
      }

      const {relatedTo, name} = fields.get(property)!;
      if (!relatedTo) {
        return new ColumnWrapper(ignoreTableName ? name : `${tableName}.${name}`);
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

function treeOf<T>(_: Optional<T>, tableInfo: ITableInfo): any {
  validateModel(_, tableInfo);
  return and(
    ...Object.keys(_)
      .map(field => (new ColumnWrapper(resolveColumn(field as string, tableInfo)) as IOperandable<T>).eq(_[field]))
  );
}

function columnsOf<T>(_: ColumnsList<T>, {tableName, fields}: ITableInfo): any {
  _.forEach(field => {
    if (!fields.has(field as string) || fields.get(field as string)!.relatedTo) {
      throw new Error(`Field '${field}' should be decorated with @dbField()`)
    }
  });
  return _.map(field => ({_column: resolveColumn(field as string, {tableName, fields})}));
}

function resolveColumn(property: string, {tableName, fields}: ITableInfo): string {
  return tableName + '.' + fields.get(property)!.name;
}

function validateModel<T>(_: Optional<T>, tableInfo: ITableInfo): void {
  validateFields(Object.keys(_), tableInfo);
}

function validateFields(_: string[], tableInfo: ITableInfo): void {
  _.forEach(prop => {
    if(!tableInfo.fields.has(prop)) {
      throw new Error(`Field '${prop}' should be annotated with @dbField() or @dbManyField()`);
    }
  });
}

function where<T>(this: IBuildableWherePartial, _: Optional<T> | WhereBuilder<T>) {
  const tree = typeof _ === 'function'
    ? (_ as WhereBuilder<T>)(proxy<T>(this._table))
    : treeOf(_, this._table);
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
  if (typeof _ === 'function') {
    this._values = (_ as ValuesBuilder<T>)(proxy<T>(this._table));
  } else {
    validateModel(_, this._table);
    this._values = Object
      .keys(_)
      .map(prop => this._table.fields.get(prop))
      .reduce((p: any, c: IFieldInfo) => {
        let value = c.getValue(_);
        if (!value && c.defaults) {
          value = c.defaults;
        }
        if (c.json === true) {
          try {
            value = JSON.stringify(value);
          } catch(err) {
            throw new Error(`Invalid JSON object ${value} for field ${c.name}`);
          }
        }
        return { ...p, [c.name]: value };
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
      if (v.isPrimaryKey) {
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
    conflict
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
