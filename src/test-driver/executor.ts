import {IQueryExecutor, IQueryExecutorProvider, reader, TableMetaProvider} from '../';
import { TestQuery, TestQueryResult } from './interfaces';
import {injectable} from "inversify";

@injectable()
export class TestExecutor implements IQueryExecutor<TestQuery, TestQueryResult> {
  execute(query: TestQuery): Promise<ReadonlyArray<TestQueryResult>>;
  execute(query: TestQuery, scalar: true): Promise<number>;
  execute<X extends TableMetaProvider>(query: TestQuery, Model: X, sensitive?: boolean): Promise<ReadonlyArray<InstanceType<X>>>;
  public execute(query: TestQuery, Model?: unknown | true, sensitive = false): Promise<any> {
    return Promise.resolve(reader(query, Model as any, sensitive));
  }
}

@injectable()
export class TestExecutorProvider implements IQueryExecutorProvider<TestQuery> {

  private executor = new TestExecutor();

  getExecutor(): IQueryExecutor<TestQuery> {
    return this.executor;
  }
}
