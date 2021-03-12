import {ITableInfo, IFieldInfo, WhereBuilder} from './interfaces';
import {TableMetadataSymbol} from "./symbols";

import {readable} from "@ts-awesome/model-reader";

function ensureTableInfo(proto: any): ITableInfo {
  if (typeof proto[TableMetadataSymbol] !== 'object') {
    proto[TableMetadataSymbol] = {
      tableName: '',
      fields: new Map<string, IFieldInfo>(),
      indexes: []
    };
  }

  return proto[TableMetadataSymbol];
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
    const tableInfo = ensureTableInfo(target);
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
    const tableInfo = ensureTableInfo(target.constructor);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      let {name, primaryKey, kind, ...rest}: IDBFieldMeta = fieldMeta;
      name = name ?? (typeof key === 'string' ? key : key.toString());
      fields.set(key.toString(), {
        ...rest,
        name,
        primaryKey,
        kind,
        getValue: x => x[key],
      });
      if (primaryKey) {
        tableInfo.primaryKey = name;
      }

    } else {
      fields.set(key.toString(), {
        name: fieldMeta || key,
        getValue: x => x[key],
      });
    }

    const {model, nullable = false} = fields.get(key.toString())!;
    readable(model as any, nullable as any)(target, key);
  }
}

interface IDBManyFieldMeta extends Pick<IFieldInfo, 'nullable'|'model'|'kind'>{
  table: string;
  keyField: string;
  valueField: string;
}

// noinspection JSUnusedGlobalSymbols
export function dbManyField(fieldMeta: IDBManyFieldMeta): PropertyDecorator {
  return function (target: Object, key: string | symbol): void {
    const {fields} = ensureTableInfo(target.constructor);
    let {valueField, keyField, table, ...rest}: IDBManyFieldMeta = fieldMeta;
    fields.set(key.toString(), {
      ...rest,
      name: valueField,
      relatedTo: {
        keyField,
        tableName: table,
      },
      getValue: x => x[key],
    });
  };
}
