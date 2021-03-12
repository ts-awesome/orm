import { TestExecutor } from './executor';
import { ITransaction } from '../';
import {TestQuery, TestQueryResult} from './interfaces';

export class TestTransaction extends TestExecutor implements ITransaction<TestQuery, TestQueryResult> {
  public readonly finished = false;

  public async commit(): Promise<void> {
    console.log('COMMIT');
  }

  public async rollback(): Promise<void> {
    console.log('ROLLBACK');
  }
}
