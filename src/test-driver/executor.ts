import {IQueryExecutor, IQueryExecutorProvider} from '../';
import {Mapper, TestQuery, TestQueryResult} from './interfaces';
import {injectable, unmanaged} from "inversify";
import {BaseExecutor} from "../base";

@injectable()
export class TestExecutor extends BaseExecutor<TestQuery, TestQueryResult> {
  protected do(query: TestQuery): Promise<TestQueryResult[]> {
    return Promise.resolve(this._mapper(query));
  }

  private _mapper: Mapper;

  public set mapper(value: Mapper) {
    this._mapper = value;
  }
}

@injectable()
export class TestExecutorProvider implements IQueryExecutorProvider<TestQuery> {

  constructor(
    @unmanaged()
    private readonly executor: IQueryExecutor<TestQuery> = new TestExecutor()
  ) {
  }

  getExecutor(): IQueryExecutor<TestQuery> {
    return this.executor;
  }
}
