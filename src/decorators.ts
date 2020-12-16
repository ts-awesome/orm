import {ITableInfo, IFieldInfo, WhereBuilder} from './interfaces';

function ensureTableInfo(proto: {tableInfo?: ITableInfo}): ITableInfo {
  if (!proto.tableInfo) {
    proto.tableInfo = {
      tableName: '',
      fields: new Map<string, IFieldInfo>(),
      indexes: []
    };
  }

  return proto.tableInfo;
}

interface IDBIndexMeta<T> {
  fields: string[];
  name: string;
  default?: boolean;
  where?: WhereBuilder<T>;
}

export function dbTable<TFunction extends Function>(target: TFunction): TFunction | void;
export function dbTable<T>(tableName?: string, uniqueIndexes?: IDBIndexMeta<T>[]): ClassDecorator;
export function dbTable<T>(...args: any): ClassDecorator {
  let tableName, uniqueIndexes;
  if (args.length > 0 && typeof args[0] === 'function') {
    // @ts-ignore
    return validator(...args);
  }

  [tableName, uniqueIndexes] = args;
  return validator;

  function validator <TFunction extends Function>(target: TFunction): TFunction | void {
    const tableInfo = ensureTableInfo(target.prototype);
    tableInfo.tableName = tableName ?? target.name
      .replace(/Model$/, '')
      .toLowerCase();
    uniqueIndexes?.forEach(ui => {
      tableInfo.indexes!.push({
        name: ui.name,
        keyFields: ui.fields,
        where: ui.where,
        default: ui.default || false,
      });
    });
  }
}

interface IDBFieldMeta extends Omit<IFieldInfo, 'getValue' | 'relatedTo' | 'name'> {
  name?: string;
}

export function dbField(target: any, key: string): void;
export function dbField(fieldMeta?: string | IDBFieldMeta): PropertyDecorator;
export function dbField(...args: any): PropertyDecorator {
  let fieldMeta;
  if (args.length > 1 && typeof args[1] === 'string') {
    // @ts-ignore
    return validator(...args);
  }

  [fieldMeta] = args;
  return validator;

  function validator(target: Object, key: string | symbol): void {
    const tableInfo = ensureTableInfo(target.constructor.prototype);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      let {name, primaryKey, kind, ...rest}: IDBFieldMeta = fieldMeta;
      name = name ?? (typeof key === 'string' ? key : key.toString());
      fields.set(key.toString(), {
        ...rest,
        name,
        primaryKey,
        kind,
        getValue(rec: any) { return rec[key] },
      });
      if (primaryKey) {
        tableInfo.primaryKey = name;
      }

    } else {
      fields.set(key.toString(), {
        name: fieldMeta || key,
        getValue(rec: any) { return rec[key] },
      });
    }
  }
}

interface IDBManyFieldMeta {
  table: string;
  keyField: string;
  valueField: string;
}

export function dbManyField(fieldMeta: IDBManyFieldMeta): PropertyDecorator {
  return function (target: Object, key: string | symbol): void {
    const {fields} = ensureTableInfo(target.constructor.prototype);
    let {valueField, keyField, table}: IDBManyFieldMeta = fieldMeta;
    fields.set(key.toString(), {
      name: valueField,
      relatedTo: {
        keyField,
        tableName: table
      },
      getValue: (rec: any) => rec[key]
    });
  };
}
