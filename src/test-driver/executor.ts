import {IQueryData, IQueryExecutor} from '../';
import { TestQuery, TestQueryResult } from './interfaces';

export class TestExecutor implements IQueryExecutor<TestQuery, TestQueryResult> {
  public execute(query: IQueryData): Promise<any> {
    return Promise.resolve(query as any);
  }
}
