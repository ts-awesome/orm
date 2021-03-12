import {IQueryData, TableMetaProvider} from "./interfaces";
import _ from '@ts-awesome/model-reader';
import {TableMetadataSymbol} from "./symbols";

function iterate<T, X>(x: Iterable<T>, iterator: (x, idx) => X): X[] {
  const res: X[] = [];
  let idx = 0;
  for(const value of x) {
    res.push(iterator(value, idx++));
  }
  return res;
}

export function reader(data: ReadonlyArray<IQueryData>): IQueryData[];
export function reader(data: ReadonlyArray<IQueryData>, count: true): number;
export function reader<X extends TableMetaProvider<any>>(data: ReadonlyArray<IQueryData>, Model: X, sensitive?: boolean): ReadonlyArray<InstanceType<X>>;
export function reader<X extends TableMetaProvider<any>>(data: ReadonlyArray<IQueryData>, Model?: true | X, readSensitive = false): any{
  if (Model === true) {
    return readCount(data);
  }

  if (Model == null) {
    return data;
  }

  const colPropMap = {};
  const {fields = new Map()} = Model.prototype[TableMetadataSymbol] ?? {};
  fields.forEach(({name}, propName) => {
    colPropMap[name] = propName;
  });

  const processed = iterate(data, (row) => {
    const res = {};

    Object.keys(row).forEach(col => {
      let propName = colPropMap[col];
      const value = row[col];
      if (!propName) {
        res[col] = value;
        return;
      }

      const {kind, sensitive} = fields.get(propName) ?? {};

      if (sensitive === true && readSensitive !== true) {
        return;
      }

      if (typeof kind === 'string' || typeof kind === 'symbol') {
        throw new Error(`DbField specified by string or symbol is not support since 1.0.0 on field ${propName}`);
      }

      const {reader = (x: any) => x} = kind ?? {};
      res[propName] = reader(value as any);
    });

    return res;
  })

  return _(processed, [Model], true);
}

function readCount(data: ReadonlyArray<IQueryData>): number {
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
