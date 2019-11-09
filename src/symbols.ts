export const DbFieldSymbol = Symbol.for('DbField');
export const dbReaderSymbolFor = ({name}: Function) => Symbol.for(`IDbReader<${name}>`);

export const Symbols = {
  DbField: DbFieldSymbol,
  dbReaderFor: dbReaderSymbolFor,
};

export default Symbols;
