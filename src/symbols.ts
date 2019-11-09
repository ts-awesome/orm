export const DbFieldSymbol = Symbol.for('IDbField');
export const SqlQueryDriverSymbol = Symbol.for('IQueryDriver<ISqlQuery>');
export const SqlQueryBuilderSymbol = Symbol.for('IBuildableQueryCompiler<ISqlQuery>');
export const SqlQueryExecutorProviderSymbol = Symbol.for('IQueryExecutorProvider<ISqlQuery>');

export const dbReaderSymbolFor = ({name}: Function) => Symbol.for(`IDbReader<${name}>`);

export const Symbols = {
  DbField: DbFieldSymbol,
  SqlQueryDriver: SqlQueryDriverSymbol,
  SqlQueryBuilder: SqlQueryBuilderSymbol,
  SqlQueryExecutorProvider: SqlQueryExecutorProviderSymbol,
  dbReaderFor: dbReaderSymbolFor,
};

export default Symbols;
