import {ITableInfo, IFieldInfo, WhereBuilder, IIndexInfo} from './interfaces';

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

interface IDBFieldMeta {
  name?: string;
  uid?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  readonly?: boolean;
  json?: boolean;
}

export function dbField(fieldMeta?: string | IDBFieldMeta): PropertyDecorator {
  return function (target: Object, key: string) {
    const tableInfo = ensureTableInfo(target.constructor.prototype);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      let {name, primaryKey, uid, autoIncrement, readonly, json}: IDBFieldMeta = fieldMeta;
      name = name || key;
      fields.set(key, {
        name,
        isPrimaryKey: primaryKey,
        uid,
        autoIncrement,
        readonly,
        json,
        getValue: (rec: any) => rec[key]
      });
      if (primaryKey) {
        tableInfo.primaryKey = name;
      }

    } else {
      fields.set(key, {
        name: fieldMeta || key,
        getValue: (rec: any) => rec[key]
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
