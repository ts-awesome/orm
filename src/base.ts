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
import {NamedParameter} from "./wrappers";

@injectable()
export abstract class BaseCompiler<TQuery> implements IBuildableQueryCompiler<TQuery> {
  abstract compile(query: IBuildableQuery): TQuery;
}

@injectable()
export abstract class BaseExecutor<TQuery, R extends IQueryData = IQueryData> implements IQueryExecutor<TQuery, R> {
  protected _beforeRequest?: (query: TQuery) => Promise<void>;
  protected _afterRequest?: (query: TQuery, data: readonly Readonly<R>[]) => Promise<void>;

  execute(query: TQuery & WithParams): Promise<readonly R[]>;
  execute(query: TQuery & WithParams, scalar: true): Promise<number>;
  execute<X extends TableMetaProvider>(query: TQuery & WithParams, Model: X, sensitive?: boolean): Promise<readonly InstanceType<X>[]>;
  public async execute(query: TQuery & WithParams, Model?: unknown | true, sensitive = false): Promise<any> {
    const proto = Object.getPrototypeOf(query);
    query = {
      ...query,
      params: {
        ...this._namedParameters,
        ...query.params,
      }
    }
    Object.setPrototypeOf(query, proto);

    void this._beforeRequest?.(query);
    const result = await this.do(query);
    void this._afterRequest?.(query, result);

    return reader(result, Model as any, sensitive);
  }

  protected abstract do(query: TQuery & WithParams): Promise<readonly R[]>;

  protected _namedParameters: Record<string, DbValueType> = {};

  public get namedParameters(): Readonly<Record<string, DbValueType>> {
    return {...this._namedParameters};
  }
  public setNamedParameter<T extends DbValueType>(param: NamedParameter<T>, value: T): void {
    this._namedParameters[(param as any)._named] = value;
  }
  public removeNamedParameter(param: NamedParameter<unknown>): void {
    delete this._namedParameters[(param as any)._named];
  }
}

@injectable()
export abstract class BaseExecutorProvider<TQuery> implements IQueryExecutorProvider<TQuery> {
  abstract getExecutor(): IQueryExecutor<TQuery>;
}

@injectable()
export abstract class BaseTransaction<TQuery, R extends IQueryData = IQueryData, IL = IsolationLevel> extends BaseExecutor<TQuery, R> implements ITransaction<TQuery, R, IL> {
  abstract readonly finished: boolean;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  abstract setIsolationLevel(isolationLevel: IL): Promise<void>;
}

@injectable()
export abstract class BaseDriver<TQuery, R extends IQueryData = IQueryData, IL = IsolationLevel> extends BaseExecutor<TQuery, R> implements IQueryDriver<TQuery, R, IL> {
  protected abstract startTransaction(isolationLevel?: IL): Promise<ITransaction<TQuery, R, IL>>;

  async begin(isolationLevel?: IL): Promise<ITransaction<TQuery, R, IL>> {
    const transaction = await this.startTransaction(isolationLevel);
    if (transaction instanceof BaseExecutor) {
      const instance = transaction as never as BaseDriver<TQuery, R>;
      instance._afterRequest = this._afterRequest
      instance._beforeRequest = this._beforeRequest
      instance._namedParameters = { ...this._namedParameters };
    }
    return transaction;
  }

  abstract end(): Promise<void>;
}
