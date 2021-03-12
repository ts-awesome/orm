const {SupportedOperations, Operandable} = require("../src/wrappers");

describe('Operations should return correct intermediate query', () => {

    const thisData = [1, 2, 3, 4, 5];
    const givenValue = 5;

    it('Equal operation', () => {
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('Not equal operation', () => {
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LIKE operation', () => {
        const result = SupportedOperations.like.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('IN operation', () => {
        const result = SupportedOperations.in.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('HAS operation', () => {
        const result = SupportedOperations.has.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([givenValue, thisData]);
    });

    it('BETWEEN operation', () => {
        const lowerGivenValue = 5;
        const highGivenValue = 10;
        const result = SupportedOperations.between.call(thisData, lowerGivenValue, highGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands).toStrictEqual([thisData, lowerGivenValue, highGivenValue]);
    });

    it('GREATER THAN operation', () => {
        const result = SupportedOperations.gt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('GREATER THAN EQUAL operation', () => {
        const result = SupportedOperations.gte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN operation', () => {
        const result = SupportedOperations.lt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN EQUAL operation', () => {
        const result = SupportedOperations.lte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('ADD operation', () => {
        const result = SupportedOperations.add.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('SUBTRACTION operation', () => {
        const result = SupportedOperations.sub.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MULTIPLY operation', () => {
        const result = SupportedOperations.mul.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('DIVISION operation', () => {
        const result = SupportedOperations.div.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MODULO operation', () => {
        const result = SupportedOperations.mod.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('AND operation', () => {
        const result = SupportedOperations.and.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('OR operation', () => {
        const result = SupportedOperations.or.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('XOR operation', () => {
        const result = SupportedOperations.xor.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });
});

describe('Operations should return correct intermediate query if given value is subquery', () => {

    const thisData = [1, 2, 3, 4, 5];
    const givenValue = 5;
    const subQueryGivenValue = SupportedOperations.eq.call(thisData, givenValue);

    it('Equal operation', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('Not equal operation', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LIKE operation', () => {
        const result = SupportedOperations.like.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('IN operation', () => {
        const result = SupportedOperations.in.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('HAS operation', () => {
        const result = SupportedOperations.has.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[0]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([subQueryGivenValue, thisData]);
    });

    it('BETWEEN operation', () => {
        const result = SupportedOperations.between.call(thisData, subQueryGivenValue, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands[2]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue, subQueryGivenValue]);
    });

    it('GREATER THAN operation', () => {
        const result = SupportedOperations.gt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('GREATER THAN EQUAL operation', () => {
        const result = SupportedOperations.gte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN operation', () => {
        const result = SupportedOperations.lt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN EQUAL operation', () => {
        const result = SupportedOperations.lte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('ADD operation', () => {
        const result = SupportedOperations.add.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('SUBTRACTION operation', () => {
        const result = SupportedOperations.sub.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MULTIPLY operation', () => {
        const result = SupportedOperations.mul.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('DIVISION operation', () => {
        const result = SupportedOperations.div.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MODULO operation', () => {
        const result = SupportedOperations.mod.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('AND operation', () => {
        const result = SupportedOperations.and.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('OR operation', () => {
        const result = SupportedOperations.or.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('XOR operation', () => {
        const result = SupportedOperations.xor.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });
});

describe('Operations should correct process null value', () => {

    const thisData = [1, 2, 3, 4, 5];

    it('Equal operation', () => {
        const givenValue = null;
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });

    it('A non-equal operation', () => {
        const givenValue = null;
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS NOT');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });
});