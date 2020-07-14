import { Column } from './interfaces';

export interface IBinaryOperators {
  _operator: '&' | '|' | '^';
  _operands: [any, any]
}

export interface ILogicalOperators {
  _operator: 'IN' | 'BETWEEN' | 'LIKE';
  _operands: [any, any]
}

export interface IComparisonOperators {
  _operator: '=' | '>' | '<' | '>=' | '<=' | '<>';
  _operands: [any, any]
}

export interface IArithmeticOperators {
  _operator: '+' | '-' | '*' | '/' | '%';
  _operands: [any, any]
}

export type whereOperators = IComparisonOperators & ILogicalOperators;

export interface IOrder<T> {
  _column: Column<T>;
  _order: 'ASC' | 'DESC'
}