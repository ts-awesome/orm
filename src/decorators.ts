import {ITableInfo, IFieldInfo, WhereBuilder, IIndexInfo, DbValueType, IDbField} from './interfaces';

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

export function dbTable<T>(tableName: string, uniqueIndexes?: IDBIndexMeta<T>[]): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction) {
    const tableInfo = ensureTableInfo(target.prototype);
    tableInfo.tableName = tableName;
    if (uniqueIndexes) {
      uniqueIndexes.forEach(ui => {
        tableInfo.indexes!.push({
          name: ui.name,
          keyFields: ui.fields,
          where: ui.where,
          default: ui.default || false,
        });
      });
    }
  };
}

interface IDBFieldMeta extends Omit<IFieldInfo, 'getValue' | 'relatedTo' | 'name'> {
  name?: string;

  /** @deprecated */
  uid?: boolean;
  /** @deprecated */
  json?: boolean;
}

export function dbField(fieldMeta?: string | IDBFieldMeta): PropertyDecorator {
  return function (target: Object, key: string) {
    const tableInfo = ensureTableInfo(target.constructor.prototype);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      let {name, primaryKey, uid, json, kind, ...rest}: IDBFieldMeta = fieldMeta;
      if (uid) {
        console.warn(`Flag dbField.uid is deprecated. Please use dbField.kind instead.`);
        kind = kind || 'uuid';
      }
      if (json) {
        console.warn(`Flag dbField.json is deprecated. Please use dbField.kind instead.`);
        kind = kind || 'json';
      }
      name = name || key;
      fields.set(key, {
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
      fields.set(key, {
        name: fieldMeta || key,
        getValue(rec: any) { return rec[key] },
      });
    }
  };
}

interface IDBManyFieldMeta {
  table: string;
  keyField: string;
  valueField: string;
}

export function dbManyField(fieldMeta: IDBManyFieldMeta): PropertyDecorator {
  return function (target: Object, key: string): void {
    const {fields} = ensureTableInfo(target.constructor.prototype);
    let {valueField, keyField, table}: IDBManyFieldMeta = fieldMeta;
    fields.set(key, {
      name: valueField,
      relatedTo: {
        keyField,
        tableName: table
      },
      getValue: (rec: any) => rec[key]
    });
  };
}
