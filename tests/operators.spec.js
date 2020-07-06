const {SupportedOperations, Operandable} = require("../src/wrappers");

describe('Operators should return correct intermediate query', () => {

    const thisData = [1, 2, 3, 4, 5];
    const givenValue = 5;

    it('Equal operator', () => {
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('Not equal operator', () => {
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LIKE operator', () => {
        const result = SupportedOperations.like.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('IN operator', () => {
        const result = SupportedOperations.in.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('HAS operator', () => {
        const result = SupportedOperations.has.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([givenValue, thisData]);
    });

    it('BETWEEN operator', () => {
        const lowerGivenValue = 5;
        const highGivenValue = 10;
        const result = SupportedOperations.between.call(thisData, lowerGivenValue, highGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands).toStrictEqual([thisData, lowerGivenValue, highGivenValue]);
    });

    it('GREATER THAN operator', () => {
        const result = SupportedOperations.gt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('GREATER THAN EQUAL operator', () => {
        const result = SupportedOperations.gte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN operator', () => {
        const result = SupportedOperations.lt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN EQUAL operator', () => {
        const result = SupportedOperations.lte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('ADD operator', () => {
        const result = SupportedOperations.add.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('SUBTRACTION operator', () => {
        const result = SupportedOperations.sub.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MULTIPLY operator', () => {
        const result = SupportedOperations.mul.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('DIVISION operator', () => {
        const result = SupportedOperations.div.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MODULO operator', () => {
        const result = SupportedOperations.mod.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('AND operator', () => {
        const result = SupportedOperations.and.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('OR operator', () => {
        const result = SupportedOperations.or.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('XOR operator', () => {
        const result = SupportedOperations.xor.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });
});

describe('Operators should return correct intermediate query if given value is subquery', () => {

    const thisData = [1, 2, 3, 4, 5];
    const givenValue = 5;
    const subQueryGivenValue = SupportedOperations.eq.call(thisData, givenValue);

    it('Equal operator', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('Not equal operator', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LIKE operator', () => {
        const result = SupportedOperations.like.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('IN operator', () => {
        const result = SupportedOperations.in.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('HAS operator', () => {
        const result = SupportedOperations.has.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[0]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([subQueryGivenValue, thisData]);
    });

    it('BETWEEN operator', () => {
        const result = SupportedOperations.between.call(thisData, subQueryGivenValue, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands[2]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue, subQueryGivenValue]);
    });

    it('GREATER THAN operator', () => {
        const result = SupportedOperations.gt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('GREATER THAN EQUAL operator', () => {
        const result = SupportedOperations.gte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN operator', () => {
        const result = SupportedOperations.lt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN EQUAL operator', () => {
        const result = SupportedOperations.lte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('ADD operator', () => {
        const result = SupportedOperations.add.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('SUBTRACTION operator', () => {
        const result = SupportedOperations.sub.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MULTIPLY operator', () => {
        const result = SupportedOperations.mul.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('DIVISION operator', () => {
        const result = SupportedOperations.div.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MODULO operator', () => {
        const result = SupportedOperations.mod.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('AND operator', () => {
        const result = SupportedOperations.and.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('OR operator', () => {
        const result = SupportedOperations.or.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('XOR operator', () => {
        const result = SupportedOperations.xor.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });
});

describe('Operators should correct process null value', () => {

    const thisData = [1, 2, 3, 4, 5];

    it('Equal operator', () => {
        const givenValue = null;
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });

    it('A non-equal operator', () => {
        const givenValue = null;
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS NOT');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });
});