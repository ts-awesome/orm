import { injectable } from 'inversify';
import { TestExecutor } from './executor';
import { IQueryDriver, ITransaction } from '../';
import {TestQuery, TestQueryResult} from './interfaces';
import { TestTransaction } from './transaction';

@injectable()
export class TestDriver extends TestExecutor implements IQueryDriver<TestQuery, TestQueryResult> {
  public async begin(): Promise<ITransaction<TestQuery, TestQueryResult>> {
    return new TestTransaction();
  }

  public end(): Promise<void> {
    return Promise.resolve()
  }

}
