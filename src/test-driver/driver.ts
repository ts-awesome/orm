import { injectable } from 'inversify';
import { TestExecutor } from './executor';
import {IQueryDriver, IsolationLevel, ITransaction} from '../';
import {TestQuery, TestQueryResult} from './interfaces';
import { TestTransaction } from './transaction';

@injectable()
export class TestDriver extends TestExecutor implements IQueryDriver<TestQuery, TestQueryResult> {
  private _active = true;

  public get active(): boolean {
    return this._active;
  }

  public async begin(isolationLevel?: IsolationLevel): Promise<ITransaction<TestQuery, TestQueryResult>> {
    return new TestTransaction(isolationLevel);
  }

  public end(): Promise<void> {
    this._active = false;
    return Promise.resolve()
  }

}
