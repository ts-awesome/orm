export const SqlQueryDriverSymbol = Symbol.for('IQueryDriver<ISqlQuery>');
export const SqlQueryBuilderSymbol = Symbol.for('IBuildableQueryCompiler<ISqlQuery>');
export const SqlQueryExecutorProviderSymbol = Symbol.for('IQueryExecutorProvider<ISqlQuery>');

export const dbReaderSymbolFor = ({name}: Function) => Symbol.for(`IDbReader<${name}>`);

export const Symbols = {
  SqlQueryDriver: SqlQueryDriverSymbol,
  SqlQueryBuilder: SqlQueryBuilderSymbol,
  SqlQueryExecutorProvider: SqlQueryExecutorProviderSymbol,
  dbReaderFor: dbReaderSymbolFor,
};

export default Symbols;
