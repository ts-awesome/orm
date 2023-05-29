
function skipAliasInOperations(op) {
  return typeof op._alias === 'string' && op._operands ? op._operands[0] : op
}

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
  this._operands = operands.map(op => skipAliasInOperations(op));
}
Operandable.prototype = SupportedOperations;

function FunctionCall(func, args) {
  this._func = func;
  this._args = args.map(op => skipAliasInOperations(op));
}
FunctionCall.prototype = SupportedOperations;

function ColumnWrapper(column) {
  this._column = column;
}
ColumnWrapper.prototype = SupportedOperations;

function AliasWrapper(expr, alias) {
  this._alias = alias;
  this._operands = [expr];
}
AliasWrapper.prototype = SupportedOperations;

function NamedParameter(name) {
  if (/^p\d+$/.test(name)) {
    throw new Error(`Named parameter ${name} is reserved`);
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Named parameter should be valid identifier`);
  }

  this._named = name;
}
NamedParameter.prototype = SupportedOperations;

function UnnamedParameter(value) {
  this._value = value;
}
UnnamedParameter.prototype = SupportedOperations;


function Constant(value) {
  function check(value) {
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(check);
    }
    return value == null || ['string', 'number', 'boolean'].indexOf(typeof value) >= 0;
  }

  if (!check(value)) {
    throw new Error(`Constant expected to be null, number, string, boolean or array of such values. Got ${JSON.stringify(value)}`);
  }

  this._const = value;
}
Constant.prototype = SupportedOperations;


module.exports = {
  SupportedOperations,
  ColumnWrapper,
  FunctionCall,
  NamedParameter,
  UnnamedParameter,
  Constant,
  AliasWrapper,
  Operandable,
}
