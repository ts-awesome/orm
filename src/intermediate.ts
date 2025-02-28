import {IBuildableSubSelectQuery} from './interfaces';

export interface IColumnRef {
  table?: string;
  name: string;
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

export interface IWindowDefinition {
  _extends?: IWindowDefinition
  _orderBy?: IOrderBy[]
  _groupBy?: IReference[]
  _mode?: 'ROWS' | 'RANGE' | 'GROUPS';
  _start?: string;
  _end?: string;
  _exclusion?: 'CURRENT ROW' | 'GROUP' | 'TIES' | 'NO OTHERS';
}

export interface IFunctionWindowCallOperation {
  _func: 'first_value' | 'last_value';
  _filter?: IExpression;
  _over: IWindowDefinition;
  _args: IExpression[];
}

export interface IReference {
  _column: IColumnRef;
}

export type IExpression = IFunctionCallOperation | IReference | IMultiOperation | ITernaryOperation | IBinaryOperation
  | IUnaryOperation | IBuildableSubSelectQuery | IAlias | INamedParameter | IConst | IUnnamedParameter | 'NULL' | '*';

export interface IOrderBy {
  _column: IColumnRef;
  _order?: 'ASC' | 'DESC';
  _nulls?: 'FIRST' | 'LAST';
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

export interface INamedParameter {
  _named: string;
}

export interface ISelectOperator {
  _operator: 'UNION' | 'INTERSECT' | 'EXCEPT';
  _distinct: boolean;
  _operand: IBuildableSubSelectQuery;
}

export interface IConst {
  _const: null | string | number | boolean | (null | string | number | boolean)[];
}

export interface IUnnamedParameter {
  _value: null | string | number | boolean | (null | string | number | boolean)[];
}
