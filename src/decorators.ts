import {ITableInfo, IFieldInfo} from './interfaces';

function ensureTableInfo(proto: {tableInfo?: ITableInfo}): ITableInfo {
  if (!proto.tableInfo) {
    proto.tableInfo = {
      tableName: '',
      fields: new Map<string, IFieldInfo>()
    };
  }

  return proto.tableInfo;
}

export function dbTable(tableName: string): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction) {
    ensureTableInfo(target.prototype).tableName = tableName;
  };
}

interface IDBFieldMeta {
  name?: string;
  uid?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  readonly?: boolean;
}

export function dbField(fieldMeta?: string | IDBFieldMeta): PropertyDecorator {
  return function (target: Object, key: string) {
    const tableInfo = ensureTableInfo(target.constructor.prototype);
    const {fields} = tableInfo;

    if (typeof fieldMeta !== 'string' && fieldMeta) {
      let {name, primaryKey, uid, autoIncrement, readonly}: IDBFieldMeta = fieldMeta;
      name = name || key;
      fields.set(key, {
        name,
        isPrimaryKey: primaryKey,
        uid,
        autoIncrement,
        readonly,
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

