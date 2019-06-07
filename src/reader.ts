import {IDbDataReader, ICountData, IQueryData, ITableInfo, TableMetaProvider} from "./interfaces";
import {NotFoundError} from "./errors";

export class DbReader<T extends TableMetaProvider<InstanceType<T>>> implements IDbDataReader<InstanceType<T>> {
  private tableInfo: ITableInfo;

  constructor(private Model: T) {
    this.tableInfo = (<any>Model.prototype).tableInfo!;
  }

  readOne(data: IQueryData[]): InstanceType<T> | undefined {
    return data.length ? this.read(data[0]) : undefined;
  }
  readOneOrRejectNotFound(data: any[]): InstanceType<T> {
    if (data.length > 0) {
      return this.read(data[0]);
    }

    throw new NotFoundError();
  }

  readMany(data: IQueryData[]): InstanceType<T>[] {
    return data.map(row => this.read(row));
  }
  readManyOrRejectNotFound(data: IQueryData[]): InstanceType<T>[] {
    if (data.length > 0) {
      return this.readMany(data);
    }

    throw new NotFoundError();
  }

  readCount(data: ICountData[]): number {
    if (data.length <= 0) {
      return 0;
    }

    const first = data[0];
    const keys = Object.keys(first);
    if (keys.length <= 0) {
      return 0;
    }

    const raw: any = first[keys[0]];
    let count = parseInt(raw);
    if (isNaN(count)) {
      throw new Error(`Can't read count value from db. Invalid Count ${raw}`);
    }

    return count;
  }

  private read(row: IQueryData): InstanceType<T> {
    let res = new this.Model();
    let colPropMap = {};
    this.tableInfo.fields.forEach(({name}, propName) => {
      colPropMap[name] = propName;
    });

    Object.keys(row).forEach(col => {
      let propName = colPropMap[col];
      const value = row[col];
      if (propName) {
        let {json, sensitive} = this.tableInfo.fields.get(propName)!;
        if (sensitive) return;
        if (json && typeof(value) !== 'object') {
          try {
            res[propName] = JSON.parse(value as any);
          } catch(err) {
            throw new Error(`Invalid JSON value ${JSON.stringify(value, null, 2)} in colument ${col}`);
          }
        } else {
          res[propName] = value;
        }
      } else {
        res[col] = value;
      }
    });

    // this.tableInfo.fields.forEach(({name}, propName) => {
    //   res[propName] = row[name];
    // });

    return res;
  }
}
