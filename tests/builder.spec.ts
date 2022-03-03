import {alias, and, asc, Delete, desc, Insert, max, Select, sum, TableMetadataSymbol, Update, Upsert, of} from '../dist';
import { Employee, Person } from './models';
import { TableRef, readModelMeta } from '../dist/builder';


const tableInfo = readModelMeta(Person);
const tableName = tableInfo.tableName;
const person: InstanceType<typeof Person> = {id: 1, name: 'Name', age: 18, city: 'City', profiles: ["profile-a"]};

describe('Select', () => {

  it('Check query info', () => {
    const query = Select(Person);
    expect(query._type).toBe('SELECT');
    expect(query._table).toStrictEqual(tableInfo);
  });

  it('Columns through array list', () => {
    const nameAlias = 'PersonName';
    const coefficient = 2;

    const columnsThroughList = Select(Person).columns(['name', 'age']);
    const columnsThroughBuilder = Select(Person).columns(({name, age}) => [name, age]);
    const columnsWithAlias = Select(Person).columns(({name}) => [alias(name, nameAlias)]);
    const columnsWithOf = Select(Person).columns(() => [of(Employee, 'company')]);
    const columnsWithExpression = Select(Person).columns(({age}) => [age.mul(coefficient), max(age)]);

    const expectation = {
      default: [
        {_column: {table: tableName, name: 'name', wrapper: undefined}},
        {_column: {table: tableName, name: 'age', wrapper: undefined}}
      ],
      alias: [
        {_alias: nameAlias, _operands: [{_column: {table: tableName, name: 'name', wrapper: undefined}}]}
      ],
      of: [
        {_column: {table: readModelMeta(Employee).tableName, name: 'company'}}
      ],
      expression: [
        {_operator: '*', _operands: [{_column: {table: tableName, name: 'age', wrapper: undefined}}, coefficient]},
        {_func: 'MAX', _args: [{_column: {table: tableName, name: 'age', wrapper: undefined}}]}
      ]
    };

    expect(columnsThroughList._columns).toStrictEqual(expectation.default);
    expect(columnsThroughBuilder._columns).toStrictEqual(expectation.default);
    expect(columnsWithAlias._columns).toStrictEqual(expectation.alias);
    expect(columnsWithOf._columns).toStrictEqual(expectation.of);
    expect(columnsWithExpression._columns).toStrictEqual(expectation.expression);
  });

  it('Joins', () => {
    const enum joinTypes {inner = 'INNER', left = 'LEFT', right = 'RIGHT', full = 'FULL OUTER'}

    const employeeTableInfo = readModelMeta(Employee);

    const innerJoin = Select(Person).join(Employee, ({id}, {personId}) => id.eq(personId));
    const leftJoin = Select(Person).joinLeft(Employee, ({id}, {personId}) => id.eq(personId));
    const rightJoin = Select(Person).joinRight(Employee, ({id}, {personId}) => id.eq(personId));
    const fullJoin = Select(Person).joinFull(Employee, ({id}, {personId}) => id.eq(personId));

    const innerJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.inner,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: employeeTableInfo.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: employeeTableInfo.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: employeeTableInfo.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: employeeTableInfo.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];

    expect(innerJoin._joins).toStrictEqual(innerJoinExpectation);
    expect(leftJoin._joins).toStrictEqual(leftJoinExpectation);
    expect(rightJoin._joins).toStrictEqual(rightJoinExpectation);
    expect(fullJoin._joins).toStrictEqual(fullJoinExpectation);
  });

  it('Joins with alias', () => {
    const tableRef = new TableRef(Employee);
    const employeeTableInfo = readModelMeta(Employee);

    const enum joinTypes {inner = 'INNER', left = 'LEFT', right = 'RIGHT', full = 'FULL OUTER'}

    const innerJoin = Select(Person).join(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const leftJoin = Select(Person).joinLeft(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const rightJoin = Select(Person).joinRight(Employee, tableRef, ({id}, {personId}) => id.eq(personId));
    const fullJoin = Select(Person).joinFull(Employee, tableRef, ({id}, {personId}) => id.eq(personId));

    const innerJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.inner,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: tableRef.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: tableRef.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: tableRef.tableName, name: `personId`, wrapper: undefined}}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, {_column: {table: tableRef.tableName, name: `personId`, wrapper: undefined}}],
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
        {_operator: '=', _operands: [{_column: {table: tableName, name: 'age', wrapper: undefined}}, person.age]},
        {_operator: 'LIKE', _operands: [{_column: {table: tableName, name: 'name', wrapper: undefined}}, person.name]},
      ]
    }];
    expect(query._where).toStrictEqual(expectation);
  });

  describe('Where filter fields', () => {
    it ('has', () => {
      const query = Select(Person).where(({profiles}) => profiles.has('test'));
      const expectation = [{
        _operands: [
          "test",
          {
            _operator: 'SUBQUERY',
            _operands: [
              {
                _columns: [{_column: { table: "employee", name: "title"}}],
                _table: { fields: null, tableName: "employee"},
                _type: "SELECT",
                _where: [
                  {
                    _operands: [
                      { _column: { table: "employee", name: "person"}},
                      { _column: { table: tableName, name: "id"}}
                    ],
                    _operator: "="
                  }
                ],
              }
            ]},
        ],
        _operator: "IN",
      }];
      expect(query._where).toStrictEqual(expectation);
    });
  });

  it('Having', () => {
    const employeeTableName = readModelMeta(Employee).tableName;
    const salaryRate = 2000;
    const query = Select(Employee)
      .columns(({salary}) => [sum(salary)])
      .groupBy(['company'])
      .having(({salary}) => sum(salary).gt(salaryRate));

    const expectation = {
      _columns: [{_func: 'SUM', _args: [{_column: {table: employeeTableName, name: 'salary', wrapper: undefined}}]}],
      _groupBy: [{_column: {table: employeeTableName, name: 'company', wrapper: undefined}}],
      _having: [{
        _operator: '>',
        _operands: [{
          _func: 'SUM',
          _args: [{_column: {table: employeeTableName, name: 'salary', wrapper: undefined}}]
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
    const expectation = [{_column: {table: tableName, name: 'city', wrapper: undefined}}];

    expect(queryThroughList._groupBy).toStrictEqual(expectation);
    expect(queryThroughBuilder._groupBy).toStrictEqual(expectation);
  });

  it('Order By', () => {
    const orderByThroughList = Select(Person).orderBy(['city']);
    const defaultOrder = Select(Person).orderBy(({city}) => [city]);
    const ascOrder = Select(Person).orderBy(({city}) => [asc(city)]);
    const descOrder = Select(Person).orderBy(({city}) => [desc(city)]);

    const expectation = {
      default: [{_column: {table: tableName, name: 'city', wrapper: undefined}}],
      asc: [{_column: {table: tableName, name: 'city', wrapper: undefined}, _order: 'ASC'}],
      desc: [{_column: {table: tableName, name: 'city', wrapper: undefined}, _order: 'DESC'}]
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

describe('Insert', () => {

  it('Check query info', () => {
    const query = Insert(Person);
    expect(query._type).toBe('INSERT');
    expect(query._table).toStrictEqual(tableInfo);
  });

  it('Insert record', () => {
    const query = Insert(Person).values(person);
    const expectation = {
      id: {value: person.id, wrapper: undefined},
      name: {value: person.name, wrapper: undefined},
      age: {value: person.age, wrapper: undefined},
      city: {value: person.city, wrapper: undefined},
    };
    expect(query._values).toStrictEqual(expectation);
    Insert(Person).values({...person, uid: 'a80ec30e-791c-4499-a243-70af8b2bf7ba'});
  });
});

describe('Upsert', () => {

  const infoMock = {
    [TableMetadataSymbol]: {}
  };

  it('Check query info', () => {
    const query = Upsert(Person);
    expect(query._type).toBe('UPSERT');
    expect(query._table).toStrictEqual(tableInfo);
  });

  it('Upsert record', () => {
    const defaultUpsert = Upsert(Person).values(person);
    const withConflict = Upsert(Person).values(person).conflict('idx');
    const expectation = {
      values: {
        id: {value: person.id, wrapper: undefined},
        name: {value: person.name, wrapper: undefined},
        age: {value: person.age, wrapper: undefined},
        city: {value: person.city, wrapper: undefined},
      },
      conflictExp: {_columns: ['id'], _where: undefined}
    };

    expect(defaultUpsert._values).toStrictEqual(expectation.values);
    expect(defaultUpsert._conflictExp).toBeUndefined();
    expect(withConflict._values).toStrictEqual(expectation.values);
    expect(withConflict._conflictExp).toStrictEqual(expectation.conflictExp);
  });

  it('Should fail if table has no primary key', () => {
    expect(() => {
      Upsert(infoMock as any).conflict();
    }).toThrowError('Current table has no primary key. Please provide unique index for upsert');
  });

  it('Should fail if table indexes meta is empty', () => {
    expect(() => {
      Upsert(infoMock as any).conflict('id');
    }).toThrowError('Table indexes meta is empty');
  });

  it('Should fail if index is not declared', () => {
    expect(() => {
      Upsert(Person).conflict('name');
    }).toThrowError(`Index name is not declared for table ${tableName}`);
  });
});

describe('Update', () => {

  it('Check query info', () => {
    const query = Update(Person);
    expect(query._type).toBe('UPDATE');
    expect(query._table).toStrictEqual(tableInfo);
  });

  it('Update record', () => {
    const limit = 10;
    const query = Update(Person).values(person).where(({id}) => id.eq(person.id)).limit(limit);
    const expectation = {
      values: {
        id: {value: person.id, wrapper: undefined},
        name: {value: person.name, wrapper: undefined},
        age: {value: person.age, wrapper: undefined},
        city: {value: person.city, wrapper: undefined},
      },
      where: [{
        _operator: '=',
        _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, person.id]
      }]
    };
    expect(query._values).toStrictEqual(expectation.values);
    expect(query._where).toStrictEqual(expectation.where);
    expect(query._limit).toBe(limit);
  });
});

describe('Delete', () => {

  it('Check query info', () => {
    const query = Delete(Person);
    expect(query._type).toBe('DELETE');
    expect(query._table).toStrictEqual(tableInfo);
  });

  it('Delete record', () => {
    const limit = 10;
    const query = Delete(Person).where(({id}) => id.eq(person.id)).limit(limit);
    const expectation = [{
      _operator: '=',
      _operands: [{_column: {table: tableName, name: 'id', wrapper: undefined}}, person.id]
    }];
    expect(query._where).toStrictEqual(expectation);
    expect(query._limit).toBe(limit);
  });
});
