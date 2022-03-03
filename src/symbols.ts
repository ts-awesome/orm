export const SqlQueryDriverSymbol = Symbol.for('IQueryDriver<ISqlQuery>');
export const SqlQueryBuilderSymbol = Symbol.for('IBuildableQueryCompiler<ISqlQuery>');
export const SqlQueryExecutorProviderSymbol = Symbol.for('IQueryExecutorProvider<ISqlQuery>');

export const TableMetadataSymbol = Symbol.for('TableMetadata');

export const Symbols = {
  SqlQueryDriver: SqlQueryDriverSymbol,
  SqlQueryBuilder: SqlQueryBuilderSymbol,
  SqlQueryExecutorProvider: SqlQueryExecutorProviderSymbol,
};

export default Symbols;
