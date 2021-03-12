const {SupportedOperations, Operandable, FunctionCall, ColumnWrapper} = require("../dist/wrappers");
const {and, or, not, all, any, exists, avg, sum, count, max, min, asc, desc, of, alias} = require('../dist/operators');

describe('Operators should return correct intermediate query', () => {
    const operandable = SupportedOperations.eq.call([1, 2, 3], 5);
    const testTable = {
        tableName: 'table_name',
        fields: new Map([
            ['test_field', {name: 'test_field'}],
            ['another_field', {name: 'another_field'}]
        ])
    };

    it('Asc operator', () => {
        const result = asc(operandable);
        expect(result).toStrictEqual({...operandable, _order: 'ASC'});
    });

    it('Desc operator', () => {
        const result = desc(operandable);

        expect(result).toStrictEqual({...operandable, _order: 'DESC'});
    });

    it('Of operator', () => {
        const field = 'test_field';
        const result = of(testTable, field);

        expect(result).toBeInstanceOf(ColumnWrapper);
        expect(result._column).toStrictEqual({table: testTable.tableName, name: 'test_field'})
    });

    it('Of operator should throw error if given filed does not exists', () => {
        const field = 'nonexistent_field';

        expect(() => {
            of(testTable, field);
        }).toThrowError(`Field '${field}' should be annotated with @dbField() or @dbManyField()`);
    });

    it('Alias operator', () => {
        const name = 'some_name';
        const result = alias(operandable, name);

        expect(result._alias).toBe(name);
        expect(result._operands).toStrictEqual([operandable]);
    });
});

describe('Operators should return correct Operandable intermediate query', () => {

    const firstOperand = true;
    const secondOperand = false;
    const subquery = {
        _type: 'SELECT',
        _table: {
            tableName: 'test_table',
            fields: new Map([['test_field', 'test value']])
        }
    };

    it('And operator', () => {
        const result = and(firstOperand, secondOperand);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('AND');
        expect(result._operands).toStrictEqual([firstOperand, secondOperand]);
    });

    it('Or operator', () => {
        const result = or(firstOperand, secondOperand);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('OR');
        expect(result._operands).toStrictEqual([firstOperand, secondOperand]);
    });

    it('Not operator', () => {
        const condition = false;
        const result = not(condition);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('NOT');
        expect(result._operands).toStrictEqual([condition]);
    });

    it('All operator', () => {
        const result = all(subquery);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('ALL');
        expect(result._operands).toStrictEqual([subquery]);
    });

    it('Any operator', () => {
        const result = any(subquery);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('ANY');
        expect(result._operands).toStrictEqual([subquery]);
    });

    it('Exists operator', () => {
        const result = exists(subquery);

        expect(result).toBeInstanceOf(Operandable);
        expect(result._operator).toBe('EXISTS');
        expect(result._operands).toStrictEqual([subquery]);
    });
});

describe('Operands should return correct FunctionalCall intermediate query', ()=> {

    const operandable = SupportedOperations.eq.call([1, 2, 3], 5);

    it('Avg operator', () => {
        const result = avg(operandable);

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('AVG');
        expect(result._args).toStrictEqual([operandable]);
    });

    it('Sum operator', () => {
        const result = sum(operandable);

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('SUM');
        expect(result._args).toStrictEqual([operandable]);
    });

    it('Count operator', () => {
        const result = count(operandable);

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('COUNT');
        expect(result._args).toStrictEqual([operandable]);
    });

    it('Count operator should return * if value was not provided', () => {
        const result = count();

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('COUNT');
        expect(result._args).toStrictEqual(['*']);
    });

    it('Max operator', () => {
        const result = max(operandable);

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('MAX');
        expect(result._args).toStrictEqual([operandable]);
    });

    it('Min operator', () => {
        const result = min(operandable);

        expect(result).toBeInstanceOf(FunctionCall);
        expect(result._func).toBe('MIN');
        expect(result._args).toStrictEqual([operandable]);
    });
});
