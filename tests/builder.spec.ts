import { alias, and, asc, desc, max, Select, sum } from '../src';
import { Employee, Person } from './models';
import { TableRef } from '../src/builder';


const tableName = (Person.prototype as any).tableInfo.tableName;
const person: InstanceType<typeof Person> = {id: 1, name: 'Name', age: 18, city: 'City'};

describe('Select', () => {

  it('Check query info', () => {
    const query = Select(Person);
    const expectation = (Person.prototype as any).tableInfo;
    expect(query._type).toBe('SELECT');
    expect(query._table).toStrictEqual(expectation);
  });

  it('Columns through array list', () => {
    const nameAlias = 'PersonName';const coefficient = 2;

    const columnsThroughList = Select(Person).columns(['name', 'age']);
    const columnsThroughBuilder = Select(Person).columns(({name, age}) => [name, age]);
    const columnsWithAlias = Select(Person).columns(({name}) => [alias(name, nameAlias)]);
    const columnsWithExpression = Select(Person).columns(({age}) => [age.mul(coefficient), max(age)]);

    const expectation = {
      default: [{_column: `${tableName}.name`}, {_column: `${tableName}.age`}],
      alias: [{_alias: nameAlias, _operands: [{_column: `${tableName}.name`}]}],
      expression: [
        {_operator: '*', _operands: [{_column: `${tableName}.age`}, coefficient]},
        {_func: 'MAX', _args: [{_column: `${tableName}.age`}]}
      ]
    };

    expect(columnsThroughList._columns).toStrictEqual(expectation.default);
    expect(columnsThroughBuilder._columns).toStrictEqual(expectation.default);
    expect(columnsWithAlias._columns).toStrictEqual(expectation.alias);
    expect(columnsWithExpression._columns).toStrictEqual(expectation.expression);
  });

  it('Joins', () => {
    const enum joinTypes {inner = 'INNER', left = 'LEFT', right = 'RIGHT', full = 'FULL OUTER'}

    const employeeTableInfo = (Employee.prototype as any).tableInfo;
    const innerJoin = Select(Person).join(Employee, ({id}, {personId}) => id.eq(personId));
    const leftJoin = Select(Person).joinLeft(Employee, ({id}, {personId}) => id.eq(personId));
    const rightJoin = Select(Person).joinRight(Employee, ({id}, {personId}) => id.eq(personId));
    const fullJoin = Select(Person).joinFull(Employee, ({id}, {personId}) => id.eq(personId));

    const innerJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.inner,
      _condition: {
        _operands: [{_column: `${tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: `${tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: `${tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: `${tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];

    expect(innerJoin._joins).toStrictEqual(innerJoinExpectation);
    expect(leftJoin._joins).toStrictEqual(leftJoinExpectation);
    expect(rightJoin._joins).toStrictEqual(rightJoinExpectation);
    expect(fullJoin._joins).toStrictEqual(fullJoinExpectation);
  });

  it('Joins with alias', () => {
    const tableRef = new TableRef(Person);
    const employeeTableInfo = (Employee.prototype as any).tableInfo;
    const enum joinTypes {inner = 'INNER', left = 'LEFT', right = 'RIGHT', full = 'FULL OUTER'}

    const innerJoin = Select(Person).join(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const leftJoin = Select(Person).joinLeft(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const rightJoin = Select(Person).joinRight(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const fullJoin = Select(Person).joinFull(Employee, tableRef, ({id}, {personId}) => id.eq(personId));

    const innerJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.inner,
      _condition: {
        _operands: [{_column: `${tableRef.tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: `${tableRef.tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: `${tableRef.tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _table: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: `${tableRef.tableName}.id`}, {_column: `${employeeTableInfo.tableName}.personId`}],
        _operator: '='
      }
    }];

    expect(innerJoin._joins).toStrictEqual(innerJoinExpectation);
    expect(leftJoin._joins).toStrictEqual(leftJoinExpectation);
    expect(rightJoin._joins).toStrictEqual(rightJoinExpectation);
    expect(fullJoin._joins).toStrictEqual(fullJoinExpectation);
  });

  it('Where', () => {
    const query = Select(Person).where(({age, name}) => and(age.eq(person.age), name.like(person.name)));
    const expectation = [{
      _operator: 'AND',
      _operands: [
        {_operator: '=', _operands: [{_column: `${tableName}.age`}, person.age]},
        {_operator: 'LIKE', _operands: [{_column: `${tableName}.name`}, person.name]},
      ]
    }];
    expect(query._where).toStrictEqual(expectation);
  });

  it('Having', () => {
    const employeeTableName = (Employee.prototype as any).tableInfo.tableName;
    const salaryRate = 2000;
    const query = Select(Employee)
      .columns(({salary}) => [sum(salary)])
      .groupBy(['company'])
      .having(({salary}) => sum(salary).gt(salaryRate));

    const expectation = {
      _columns: [{_func: 'SUM', _args: [{_column: `${employeeTableName}.salary`}]}],
      _groupBy: [{_column: `${employeeTableName}.company`}],
      _having: [{
        _operator: '>',
        _operands: [{
          _func: 'SUM',
          _args: [{_column: `${employeeTableName}.salary`}]
        }, salaryRate]
      }]
    };

    expect(query._columns).toStrictEqual(expectation._columns);
    expect(query._groupBy).toStrictEqual(expectation._groupBy);
    expect(query._having).toStrictEqual(expectation._having);
  });

  it('Group by', () => {
    const queryThroughList = Select(Person).groupBy(['city']);
    const queryThroughBuilder = Select(Person).groupBy(({city}) => [city]);
    const expectation = [{_column: `${tableName}.city`}];

    expect(queryThroughList._groupBy).toStrictEqual(expectation);
    expect(queryThroughBuilder._groupBy).toStrictEqual(expectation);
  });

  it('Order By', () => {
    const orderByThroughList = Select(Person).orderBy(['city']);
    const defaultOrder = Select(Person).orderBy(({city}) => [city]);
    const ascOrder = Select(Person).orderBy(({city}) => [asc(city)]);
    const descOrder = Select(Person).orderBy(({city}) => [desc(city)]);

    const expectation = {
      default: [{_column: `${tableName}.city`}],
      asc: [{_column: `${tableName}.city`, _order: 'ASC'}],
      desc: [{_column: `${tableName}.city`, _order: 'DESC'}]
    };

    expect(orderByThroughList._orderBy).toStrictEqual(expectation.default);
    expect(defaultOrder._orderBy).toStrictEqual(expectation.default);
    expect(ascOrder._orderBy).toStrictEqual(expectation.asc);
    expect(descOrder._orderBy).toStrictEqual(expectation.desc);
  });

  it('Limit', () => {
    const limit = 10;
    const query = Select(Person).limit(limit);
    expect(query._limit).toBe(limit);
  });

  it('Offset', () => {
    const offset = 3;
    const query = Select(Person).offset(offset);
    expect(query._offset).toBe(offset);
  });
});