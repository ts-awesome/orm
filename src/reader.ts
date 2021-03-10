import {IDbDataReader, ICountData, IQueryData, ITableInfo, TableMetaProvider} from "./interfaces";
import {NotFoundError} from "./errors";

export class DbReader<X extends TableMetaProvider<X>, T = InstanceType<X>> implements IDbDataReader<T> {
  private tableInfo: ITableInfo;

  constructor(private Model: X) {
    const info = (Model.prototype as any).tableInfo;
    if (info == null) {
      throw new Error(`Model ${Model.prototype?.constructor?.name ?? JSON.stringify(Model)} is not annotated with @dbTable`);
    }
    this.tableInfo = info;
  }

  /**
   * Converts IQueryData to T[] and returns first element of T[]
   *
   *
   * @param data
   * @returns First element from query result
   */

  readOne(data: IQueryData[]): T | undefined {
    return data.length ? this.read(data[0]) : undefined;
  }

  readOneOrRejectNotFound(data: any[]): T {
    if (data.length > 0) {
      return this.read(data[0]);
    }

    throw new NotFoundError();
  }

  readMany(data: IQueryData[]): ReadonlyArray<T> {
    return data.map(row => this.read(row));
  }

  readManyOrRejectNotFound(data: IQueryData[]): ReadonlyArray<T> {
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

  protected read(row: IQueryData): T {
    let res = new this.Model();
    let colPropMap = {};
    this.tableInfo.fields.forEach(({name}, propName) => {
      colPropMap[name] = propName;
    });

    Object.keys(row).forEach(col => {
      let propName = colPropMap[col];
      const value = row[col];
      if (!propName) {
        res[col] = value;
        return;
      }

      const {kind, sensitive} = this.tableInfo.fields.get(propName)!;

      /* No way to read sensitive data ATM */
      if (sensitive) return;

      if (!kind) {
        res[propName] = value;
        return ;
      }

      if (typeof kind === 'string' || typeof kind === 'symbol') {
        throw new Error(`DbField specified by string or symbol is not support since 1.0.0`);
      }

      const {reader = (x: any) => x} = kind ?? {};

      res[propName] = reader(value as any);
    });

    return res;
  }
}
