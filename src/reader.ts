import {IQueryData, TableMetaProvider} from "./interfaces";
import _ from '@ts-awesome/model-reader';
import {readModelMeta} from "./builder";

function iterate<T, X>(x: Iterable<T>, iterator: (x, idx) => X): X[] {
  const res: X[] = [];
  let idx = 0;
  for(const value of x) {
    res.push(iterator(value, idx++));
  }
  return res;
}

export function reader(data: ReadonlyArray<IQueryData>): IQueryData[];
export function reader(data: ReadonlyArray<IQueryData>, scalar: true): number;
export function reader<X extends TableMetaProvider>(data: ReadonlyArray<IQueryData>, Model: X, sensitive?: boolean): ReadonlyArray<InstanceType<X>>;
export function reader<X extends TableMetaProvider>(data: ReadonlyArray<IQueryData>, Model?: true | X, sensitive = false): any{
  if (Model === true) {
    return readScalar(data);
  }

  if (Model == null) {
    return data;
  }

  return readModel(Model, data, sensitive);
}

function readScalar(data: ReadonlyArray<IQueryData>): number {
  if (data.length <= 0) {
    return 0;
  }

  const first = data[0];
  const keys = Object.keys(first);
  if (keys.length <= 0) {
    return 0;
  }

  const raw: any = first[keys[0]];
  const count = parseInt(raw);
  if (isNaN(count)) {
    throw new Error(`Can't read count value from db. Invalid Count ${raw}`);
  }

  return count;
}

function readModel<X extends TableMetaProvider>(Model: X, data: ReadonlyArray<IQueryData>, includeSensitive: boolean) {
  const colPropMap = {};
  const {fields} = readModelMeta(Model, false);
  fields?.forEach(({name}, propName) => {
    colPropMap[name] = propName;
  });

  const processed = iterate(data, (row) => {
    const res = {};

    Object.keys(row).forEach(col => {
      const propName = colPropMap[col];
      const value = row[col];
      if (!propName) {
        res[col] = value;
        return;
      }

      const {kind, sensitive} = fields.get(propName) ?? {};

      if (sensitive === true && includeSensitive !== true) {
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
