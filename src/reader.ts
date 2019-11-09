import {IDbDataReader, ICountData, IQueryData, ITableInfo, TableMetaProvider, IDbField, IContainer} from "./interfaces";
import {NotFoundError} from "./errors";
import {DbFieldSymbol} from "./symbols";

export class DbReader<T extends TableMetaProvider<InstanceType<T>>> implements IDbDataReader<InstanceType<T>> {
  private tableInfo: ITableInfo;

  constructor(private Model: T, private kernel?: IContainer) {
    this.tableInfo = (<any>Model.prototype).tableInfo!;
  }

  /**
   * Converts IQueryData to T[] and returns first element of T[]
   *
   *
   * @param data
   * @returns First element from query result
   */

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

  protected read(row: IQueryData): InstanceType<T> {
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
      }

      let dbField: IDbField = kind as any;
      if (typeof kind === 'string' || typeof kind === 'symbol') {
        if (!this.kernel) {
          throw new Error(`Container is not provided`);
        }

        dbField = this.kernel.getNamed(DbFieldSymbol, kind);

        if (!dbField) {
          throw new Error(`Can't resolve IDbField data for kind: ${JSON.stringify(kind)}`);
        }
      }

      const {reader = (x: any) => x} = dbField;

      res[propName] = reader(value as any);
    });

    return res;
  }
}
