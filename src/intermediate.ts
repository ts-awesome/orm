import {IBuildableSubSelectQuery} from './interfaces';

export interface IColumnRef {
  table?: string;
  name: string;
  wrapper?(name: string): string;
}

export interface IUnaryOperation {
  _operator: '!';
  _operands: [IExpression];
}

export interface IBinaryOperation {
  _operator: '=' | '>' | '<' | '>=' | '<=' | '<>' | 'LIKE' | '+' | '-' | '*' | '/' | '%' | 'IN' | 'ANY' | 'ALL';
  _operands: [IExpression, IExpression];
}

interface ITernaryOperation {
  _operator: 'BETWEEN';
  _operands: [IExpression, IExpression, IExpression];
}

interface IMultiOperation {
  _operator: '&' | '|' | '^';
  _operands: IExpression[];
}

export interface IFunctionCallOperation {
  _func: 'AVG' | 'SUM' | 'COUNT' | 'MAX' | 'MIN';
  _args: IExpression[];
}

export interface IReference {
  _column: IColumnRef;
}

export type IExpression = IFunctionCallOperation | IReference | IMultiOperation | ITernaryOperation | IBinaryOperation | IUnaryOperation | IBuildableSubSelectQuery | IAlias | 'NULL' | '*';

export interface IOrderBy {
  _column: IColumnRef;
  _order?: 'ASC' | 'DESC';
}

export interface IJoin {
  _tableName: string;
  _condition: IExpression;
  _type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER';
  _alias?: string | undefined;
}

export interface IAlias {
  _alias: string;
  _operands: IExpression;
}
