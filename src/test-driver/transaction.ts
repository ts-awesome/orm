import { TestExecutor } from './executor';
import { ITransaction } from '../';
import {TestQuery, TestQueryResult} from './interfaces';
import {injectable} from "inversify";

@injectable()
export class TestTransaction extends TestExecutor implements ITransaction<TestQuery, TestQueryResult> {
  public finished = false;

  public async commit(): Promise<void> {
    this.finished = true;
    console.log('COMMIT');
  }

  public async rollback(): Promise<void> {
    this.finished = true;
    console.log('ROLLBACK');
  }
}
