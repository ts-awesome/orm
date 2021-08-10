import {IBuildableQuery} from "../interfaces";

export type Mapper = (x: CompiledTestQuery) => TestQueryResult[];
export type TestQuery = any;
export type TestQueryResult = any;

export interface CompiledTestQuery extends TestQuery {
  readonly raw: IBuildableQuery;

  readonly queryType: string;
  readonly tableName: string;
  readonly where: string[];
  readonly joins: string[];
  readonly queryCounter: number;
}

export const enum QueryTypes {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPSERT = 'UPSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}
