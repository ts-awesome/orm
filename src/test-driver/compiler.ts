import {injectable} from "inversify";
import { IBuildableQuery } from '../';
import { CompiledTestQuery, TestQuery } from './interfaces';
import {BaseCompiler} from "../base";

class CompilerWrapper implements CompiledTestQuery {

  constructor(
    public readonly queryCounter: number,
    public readonly raw: IBuildableQuery,
  ) {
  }

  public get queryType(): string {
    return this.raw._type;
  }

  public get tableName(): string {
    return this.raw._table?.tableName;
  }

  public get where(): string[] | null {
    switch (this.raw._type) {
      case 'SELECT':
        return this.raw._where?.map(x => JSON.stringify(x));
    }
    return null;
  }

  public get joins(): string[] | null {
    switch (this.raw._type) {
      case 'SELECT':
        return this.raw._joins?.map(x => x._tableName);
    }
    return null;
  }
}

@injectable()
export class TestCompiler extends BaseCompiler<TestQuery> {
  private queryCounter = 0;

  compile(query: IBuildableQuery): TestQuery {
    return new CompilerWrapper(++this.queryCounter, query);
  }
}
