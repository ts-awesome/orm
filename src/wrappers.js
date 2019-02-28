
const SupportedOperations = {
  eq     (value) { return new Operandable(value === null ? 'IS'     : '=',  [this, value === null ? 'NULL' : value])},
  neq    (value) { return new Operandable(value === null ? 'IS NOT' : '<>', [this, value === null ? 'NULL' : value])},
  like   (value) { return new Operandable('LIKE',    [this, value])},

  in     (value) { return new Operandable('IN',      [this, value])},
  has    (value) { return new Operandable('IN',      [value, this])},

  between(lo,hi) { return new Operandable('BETWEEN', [this, lo,hi])},
  gt     (value) { return new Operandable('>',       [this, value])},
  gte    (value) { return new Operandable('>=',      [this, value])},
  lt     (value) { return new Operandable('<',       [this, value])},
  lte    (value) { return new Operandable('<=',      [this, value])},

  add    (value) { return new Operandable('+',       [this, value])},
  sub    (value) { return new Operandable('-',       [this, value])},
  mul    (value) { return new Operandable('*',       [this, value])},
  div    (value) { return new Operandable('/',       [this, value])},
  mod    (value) { return new Operandable('%',       [this, value])},

  and    (value) { return new Operandable('&',       [this, value])},
  or     (value) { return new Operandable('|',       [this, value])},
  xor    (value) { return new Operandable('^',       [this, value])},
}

function Operandable(operator, operands){
  this._operator = operator;
  this._operands = operands;
}
Operandable.prototype = SupportedOperations;

function FunctionCall(func, args) {
  this._func = func;
  this._args = args;
}
FunctionCall.prototype = SupportedOperations;


function ColumnWrapper(column) {
  this._column = column;
}
ColumnWrapper.prototype = SupportedOperations;


module.exports = {
  SupportedOperations,
  ColumnWrapper,
  FunctionCall,
  Operandable
}
