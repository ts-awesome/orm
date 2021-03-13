import { IQueryExecutor, TableMetaProvider } from '../';
import { TestQuery, TestQueryResult } from './interfaces';

export class TestExecutor implements IQueryExecutor<TestQuery, TestQueryResult> {
  public async execute(query: TestQuery): Promise<ReadonlyArray<TestQueryResult>>;
  public async execute(query: TestQuery, count: true): Promise<number>;
  public async execute<X extends TableMetaProvider>(query: TestQuery, Model: X, sensitive?: boolean): Promise<ReadonlyArray<InstanceType<X>>>;
  public async execute(query: TestQuery): Promise<any> {
    return query as any;
  }
}
