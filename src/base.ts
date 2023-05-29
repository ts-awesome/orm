import {
  DbValueType,
  IBuildableQuery,
  IBuildableQueryCompiler,
  IQueryData, IQueryDriver,
  IQueryExecutor,
  IQueryExecutorProvider, IsolationLevel, ITransaction,
  TableMetaProvider, WithParams
} from "./interfaces";
import {injectable} from "inversify";
import {reader} from "./reader";

@injectable()
export abstract class BaseCompiler<TQuery> implements IBuildableQueryCompiler<TQuery> {
  abstract compile(query: IBuildableQuery): TQuery;
}

@injectable()
export abstract class BaseExecutor<TQuery, R extends IQueryData = IQueryData> implements IQueryExecutor<TQuery, R> {
  execute(query: TQuery & WithParams): Promise<readonly R[]>;
  execute(query: TQuery & WithParams, scalar: true): Promise<number>;
  execute<X extends TableMetaProvider>(query: TQuery & WithParams, Model: X, sensitive?: boolean): Promise<readonly InstanceType<X>[]>;
  public async execute(query: TQuery & WithParams, Model?: unknown | true, sensitive = false): Promise<any> {
    query = {
      ...query,
      params: {
        ...this._namedParameters,
        ...query.params,
      }
    }
    const result = await this.do(query);
    return reader(result, Model as any, sensitive);
  }

  protected abstract do(query: TQuery & WithParams): Promise<readonly R[]>;

  protected _namedParameters: Record<string, DbValueType> = {};

  public get namedParameters(): Readonly<Record<string, DbValueType>> {
    return {...this._namedParameters};
  }
  public setNamedParameter(name: string, value: DbValueType): void {
    this._namedParameters[name] = value;
  }
  public removeNamedParameter(name: string): void {
    delete this._namedParameters[name];
  }
}

@injectable()
export abstract class BaseExecutorProvider<TQuery> implements IQueryExecutorProvider<TQuery> {
  abstract getExecutor(): IQueryExecutor<TQuery>;
}

@injectable()
export abstract class BaseTransaction<TQuery, R extends IQueryData = IQueryData, IL = IsolationLevel> extends BaseExecutor<TQuery, R> implements ITransaction<TQuery, R, IL> {
  readonly finished: boolean;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  abstract setIsolationLevel(isolationLevel: IL): Promise<void>;
}

@injectable()
export abstract class BaseDriver<TQuery, R extends IQueryData = IQueryData, IL = IsolationLevel> extends BaseExecutor<TQuery, R> implements IQueryDriver<TQuery, R, IL> {
  abstract begin(isolationLevel?: IL): Promise<ITransaction<TQuery, R, IL>>;
  abstract end(): Promise<void>;
}
