import {
  ITableInfo,
  IFieldInfo,
  WhereBuilder,
  SubQueryBuilder,
} from './interfaces';
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
export function dbTable<T>(tableName?: string, uniqueIndexes?: readonly IDBIndexMeta<T>[]): ClassDecorator;
export function dbTable<TFunction extends Function>(...args: any[]): ClassDecorator | TFunction | void {
  let tableName, uniqueIndexes;
  if (args.length > 0 && typeof args[0] === 'function') {
    return validator<TFunction>(...(args as [TFunction]));
  }

  // eslint-disable-next-line prefer-const
  [tableName, uniqueIndexes] = args;
  return validator;

  function validator <TFunction extends Function>(target: TFunction): TFunction | void {
    const tableInfo = ensureTableInfo(target);
    tableInfo.tableName = tableName ?? target.name
      .replace(/Model$/, '')
      .toLowerCase();

    for(const ui of uniqueIndexes ?? []) {
      tableInfo.indexes?.push({
        name: ui.name,
        keyFields: ui.fields,
        where: ui.where,
        default: ui.default || false,
      });
    }
  }
}

interface IDBFieldMeta extends Omit<IFieldInfo, 'getValue' | 'relatedTo' | 'name' | 'builder'> {
  name?: string;
}

export function dbField(target: any, key: string): void;
export function dbField(fieldMeta?: string | IDBFieldMeta): PropertyDecorator;
export function dbField(...args: any[]): PropertyDecorator | void {
  let fieldMeta: string | IFieldInfo | null;
  if (args.length > 1 && typeof args[1] === 'string') {
    return validator(...(args as [unknown, string]));
  }

  // eslint-disable-next-line prefer-const
  [fieldMeta] = args;
  return validator;

  function validator(target: Object, key: string | symbol): void {
    const tableInfo = ensureTableInfo(target.constructor);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      const {name = key.toString(), primaryKey, kind, ...rest}: IDBFieldMeta = fieldMeta;
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
        name: (fieldMeta as string) || key,
        getValue: x => x[key],
      });
    }

    const {model, nullable = false} = fields.get(key.toString());
    readable(model as any, nullable as any)(target, key);
  }
}

interface IDBFilterFieldMeta {
  table: string;
  keyField: string;
  valueField: string;
}

interface IDBManyFieldMeta extends IDBFilterFieldMeta, Pick<IFieldInfo, 'nullable'|'model'|'kind'>{
}

// noinspection JSUnusedGlobalSymbols
export function dbFilterField(fieldMeta: IDBFilterFieldMeta): PropertyDecorator;
export function dbFilterField<T=number>(builder: SubQueryBuilder<T>): PropertyDecorator;
export function dbFilterField<T=unknown>(fieldMeta: IDBFilterFieldMeta | SubQueryBuilder<T>): PropertyDecorator {
  return function (target: Object, key: string | symbol): void {
    const {fields} = ensureTableInfo(target.constructor);

    if (typeof fieldMeta === 'function') {
      const name = key.toString();
      fields.set(key.toString(), {
        name,
        builder: fieldMeta,
        getValue: () => undefined,
      });
      return
    }

    const {valueField, keyField, table, ...rest}: IDBManyFieldMeta = fieldMeta;
    fields.set(key.toString(), {
      ...rest,
      name: valueField,
      relatedTo: {
        keyField,
        tableName: table,
      },
      getValue: () => undefined,
    });
  };
}

// @deprecated
// noinspection JSUnusedGlobalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function dbManyField(fieldMeta: IDBManyFieldMeta): PropertyDecorator {
  throw new Error(`@dbManyField is buggy, use @dbFilterField instead`);
  // return function (target: Object, key: string | symbol): void {
  //   const {fields} = ensureTableInfo(target.constructor);
  //   const {valueField, keyField, table, ...rest}: IDBManyFieldMeta = fieldMeta;
  //   fields.set(key.toString(), {
  //     ...rest,
  //     name: valueField,
  //     relatedTo: {
  //       keyField,
  //       tableName: table,
  //     },
  //     getValue: x => x[key],
  //   });
  //
  //   const {model, nullable = false} = fields.get(key.toString());
  //   readable(model as any, nullable as any)(target, key);
  // };
}
