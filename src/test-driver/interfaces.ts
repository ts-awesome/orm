export type Mapper = (x: CompiledTestQuery) => [];
export type TestQuery = []
export type TestQueryResult = [];

export interface CompiledTestQuery {
  queryType: string;
  tableName: string;
  where: string[];
  joins: string[];
  queryCounter: number;
}

export const enum QueryTypes {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPSERT = 'UPSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}