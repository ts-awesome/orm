import { TestExecutor } from './executor';
import {IsolationLevel, ITransaction} from '../';
import {TestQuery, TestQueryResult} from './interfaces';
import {injectable} from "inversify";

@injectable()
export class TestTransaction extends TestExecutor implements ITransaction<TestQuery, TestQueryResult> {
  public _finished = false;

  constructor(private _isolationLevel?: IsolationLevel) {
    super();
  }

  public get finished(): boolean {
    return this._finished;
  }

  public get isolationLevel(): IsolationLevel | undefined {
    return this._isolationLevel;
  }

  public async commit(): Promise<void> {
    this._finished = true;
    console.log('COMMIT');
  }

  public async rollback(): Promise<void> {
    this._finished = true;
    console.log('ROLLBACK');
  }

  async setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
    this._isolationLevel = isolationLevel;
    console.log('SET TRANSACTION ' + isolationLevel);
  }
}
