const {SupportedOperations, Operandable} = require("../src/wrappers");

describe('Check operators work correctly', () => {

    const thisData = [1, 2, 3, 4, 5];
    const givenValue = 5;
    const subQueryGivenValue = SupportedOperations.eq.call(thisData, givenValue);

    it('Equal operator should return correct intermediate query', () => {
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('Equal operator should return NULL if the passed value is null', () => {
        const givenValue = null;
        const result = SupportedOperations.eq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });

    it('Equal operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('Not equal operator should return correct intermediate query', () => {
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('Not equal operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.eq.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('A non-equal operator should return NULL if the passed value is null', () => {
        const givenValue = null;
        const result = SupportedOperations.neq.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IS NOT');
        expect(result._operands).toStrictEqual([thisData, 'NULL']);
    });

    it('LIKE operator should return correct intermediate query', () => {
        const result = SupportedOperations.like.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LIKE operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.like.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('LIKE');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('IN operator should return correct intermediate query', () => {
        const result = SupportedOperations.in.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('IN operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.in.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('HAS operator should return correct intermediate query', () => {
        const result = SupportedOperations.has.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands).toStrictEqual([givenValue, thisData]);
    });

    it('HAS operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.has.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('IN');
        expect(result._operands[0]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([subQueryGivenValue, thisData]);
    });

    it('BETWEEN operator should return correct intermediate query', () => {
        const lowerGivenValue = 5;
        const highGivenValue = 10;
        const result = SupportedOperations.between.call(thisData, lowerGivenValue, highGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands).toStrictEqual([thisData, lowerGivenValue, highGivenValue]);
    });

    it('BETWEEN operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.between.call(thisData, subQueryGivenValue, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('BETWEEN');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands[2]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue, subQueryGivenValue]);
    });

    it('GREATER THAN operator should return correct intermediate query', () => {
        const result = SupportedOperations.gt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('GREATER THAN operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.gt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('GREATER THAN EQUAL operator should return correct intermediate query', () => {
        const result = SupportedOperations.gte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('GREATER THAN EQUAL operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.gte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('>=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN operator should return correct intermediate query', () => {
        const result = SupportedOperations.lt.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.lt.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('LOWER THAN EQUAL operator should return correct intermediate query', () => {
        const result = SupportedOperations.lte.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('LOWER THAN EQUAL operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.lte.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('<=');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('ADD operator should return correct intermediate query', () => {
        const result = SupportedOperations.add.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('ADD operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.add.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('+');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('SUBTRACTION operator should return correct intermediate query', () => {
        const result = SupportedOperations.sub.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('SUBTRACTION operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.sub.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('-');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MULTIPLY operator should return correct intermediate query', () => {
        const result = SupportedOperations.mul.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MULTIPLY operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.mul.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('*');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('DIVISION operator should return correct intermediate query', () => {
        const result = SupportedOperations.div.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('DIVISION operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.div.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('/');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('MODULO operator should return correct intermediate query', () => {
        const result = SupportedOperations.mod.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('MODULO operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.mod.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('%');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('AND operator should return correct intermediate query', () => {
        const result = SupportedOperations.and.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('AND operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.and.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('&');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('OR operator should return correct intermediate query', () => {
        const result = SupportedOperations.or.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('OR operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.or.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('|');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });

    it('XOR operator should return correct intermediate query', () => {
        const result = SupportedOperations.xor.call(thisData, givenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands).toStrictEqual([thisData, givenValue]);
    });

    it('XOR operator should return correct intermediate query if given value is subquery', () => {
        const result = SupportedOperations.xor.call(thisData, subQueryGivenValue);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('^');
        expect(result._operands[1]).toBeInstanceOf(Operandable);
        expect(result._operands).toStrictEqual([thisData, subQueryGivenValue]);
    });
});