import {injectable} from "inversify";
import { IBuildableQuery, IBuildableQueryCompiler, IBuildableSelectQuery } from '../';
import { Mapper, CompiledTestQuery, TestQuery, QueryTypes } from './interfaces';

class CompilerWrapper implements CompiledTestQuery {
  private readonly _queryType: string;
  private readonly _tableName: string;
  private readonly _joins: string[] = [];
  private readonly _where: string[] = [];
  private readonly _queryCounter: number;

  constructor(query: IBuildableQuery, queryCounter: number) {
    this._queryType = query._type;
    this._tableName = query._table.tableName;
    this._queryCounter = queryCounter;

    switch (query._type) {
      case QueryTypes.SELECT: this.compileSelectQuery(query);
    }
  }

  public compileSelectQuery(query: IBuildableSelectQuery): void {
    if (query._joins) {
      query._joins.forEach(join => this._joins.push(join._tableName))
    }
    if (query._where) {
      query._where.forEach(where => this._where.push(JSON.stringify(where)))
    }
  }

  public get queryType(): string {
    return this._queryType;
  }

  public get tableName(): string {
    return this._tableName;
  }

  public get where(): string[] {
    return this._where;
  }

  public get joins(): string[] {
    return this._joins;
  }

  public get queryCounter(): number {
    return this._queryCounter;
  }
}

@injectable()
export class TestCompiler implements IBuildableQueryCompiler<TestQuery> {
  private _mapper: Mapper;
  private queryCounter = 0;

  compile(query: IBuildableQuery): TestQuery {
    return this._mapper(new CompilerWrapper(query, ++this.queryCounter));
  }

  public set mapper(value: (x: CompiledTestQuery) => []) {
    this._mapper = value;
  }
}
