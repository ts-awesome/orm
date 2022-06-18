export const SqlQueryDriverSymbol = Symbol.for('IQueryDriver<ISqlQuery>');
export const SqlQueryBuildableQueryCompilerSymbol = Symbol.for('IBuildableQueryCompiler<ISqlQuery>');
/** @deprecated use SqlQueryBuildableQueryCompilerSymbol */
export const SqlQueryBuilderSymbol = SqlQueryBuildableQueryCompilerSymbol;
export const SqlQueryExecutorProviderSymbol = Symbol.for('IQueryExecutorProvider<ISqlQuery>');

export const TableMetadataSymbol = Symbol.for('TableMetadata');

export const Symbols = {
  SqlQueryDriver: SqlQueryDriverSymbol,
  SqlQueryBuildableQueryCompiler: SqlQueryBuildableQueryCompilerSymbol,
  /** @deprecated use SqlQueryBuildableQueryCompilerSymbol */
  SqlQueryBuilder: SqlQueryBuilderSymbol,
  SqlQueryExecutorProvider: SqlQueryExecutorProviderSymbol,
};

export default Symbols;
