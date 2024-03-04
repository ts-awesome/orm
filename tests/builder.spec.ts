import {alias, and, asc, Delete, desc, Insert, max, Select, sum, TableMetadataSymbol, Update, Upsert, of} from '../dist';
import { Employee, Person, Tag } from './models';
import { TableRef, readModelMeta } from '../dist/builder';
import {count, dbField, dbTable, exists, case_, dbLookupField} from "../dist";
import {NamedParameter} from "../src/wrappers";


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
        {_column: {table: tableName, name: 'name'}},
        {_column: {table: tableName, name: 'age'}}
      ],
      alias: [
        {_alias: nameAlias, _operands: [{_column: {table: tableName, name: 'name'}}]}
      ],
      of: [
        {_column: {table: readModelMeta(Employee).tableName, name: 'company'}}
      ],
      expression: [
        {_operator: '*', _operands: [{_column: {table: tableName, name: 'age'}}, coefficient]},
        {_func: 'MAX', _args: [{_column: {table: tableName, name: 'age'}}]}
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
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: employeeTableInfo.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: employeeTableInfo.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: employeeTableInfo.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: undefined,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: employeeTableInfo.tableName, name: `personId`}}],
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
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: tableRef.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const leftJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.left,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: tableRef.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const rightJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.right,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: tableRef.tableName, name: `personId`}}],
        _operator: '='
      }
    }];
    const fullJoinExpectation = [{
      _tableName: employeeTableInfo.tableName,
      _alias: tableRef.tableName,
      _type: joinTypes.full,
      _condition: {
        _operands: [{_column: {table: tableName, name: 'id'}}, {_column: {table: tableRef.tableName, name: `personId`}}],
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
        {_operator: '=', _operands: [{_column: {table: tableName, name: 'age'}}, person.age]},
        {_operator: 'LIKE', _operands: [{_column: {table: tableName, name: 'name'}}, person.name]},
      ]
    }];
    expect(query._where).toStrictEqual(expectation);
  });

  describe('Where filter fields', () => {
    it ('simple many to many', () => {
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

    it ('with builder', () => {
      const query = Select(Person).where(({tags}) => tags.has('tag'));
      const expectation = [{
        _operands: [
          "tag",
          {
            _operator: 'SUBQUERY',
            _operands: [
              {
                _columns: [{_column: { table: "Tag", name: "name"}}],
                _table: readModelMeta(Tag),
                _alias: null,
                _type: "SELECT",
                _distinct: false,
                "_for": undefined,
                _joins: [
                  {
                    _alias: undefined,
                    _tableName: "TagPerson",
                    _type: "INNER",
                    _condition: {
                      _operands: [
                        {
                          _operands: [
                            {
                              _column: {
                                name: 'id',
                                table: "Tag",
                              }
                            },
                            {
                              _column: {
                                name: 'tag',
                                table: "TagPerson",
                              }
                            }
                          ],
                          _operator: '='
                        },
                        {
                          _operands: [
                            {
                              _column: {
                                name: 'person',
                                table: "TagPerson",
                              }
                            },
                            {
                              _column: {
                                name: 'id',
                                table: "Person",
                              }
                            }
                          ],
                          _operator: '='
                        },
                      ],
                      _operator: 'AND'
                    }
                  }
                ]
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
      _columns: [{_func: 'SUM', _args: [{_column: {table: employeeTableName, name: 'salary'}}]}],
      _groupBy: [{_column: {table: employeeTableName, name: 'company'}}],
      _having: [{
        _operator: '>',
        _operands: [{
          _func: 'SUM',
          _args: [{_column: {table: employeeTableName, name: 'salary'}}]
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
    const expectation = [{_column: {table: tableName, name: 'city'}}];

    expect(queryThroughList._groupBy).toStrictEqual(expectation);
    expect(queryThroughBuilder._groupBy).toStrictEqual(expectation);
  });

  it('Order By', () => {
    const orderByThroughList = Select(Person).orderBy(['city']);
    const defaultOrder = Select(Person).orderBy(({city}) => [city]);
    const ascOrder = Select(Person).orderBy(({city}) => [asc(city)]);
    const descOrder = Select(Person).orderBy(({city}) => [desc(city)]);
    const numberedOrder = Select(Person).orderBy(() => [asc(0), desc(1)]);

    const expectation = {
      default: [{_column: {table: tableName, name: 'city'}}],
      asc: [{_column: {table: tableName, name: 'city'}, _order: 'ASC', _nulls: undefined}],
      desc: [{_column: {table: tableName, name: 'city'}, _order: 'DESC', _nulls: undefined}],
      numbered: [{_column: 0, _order: 'ASC', _nulls: undefined}, {_column: 1, _order: 'DESC', _nulls: undefined}],
    };

    expect(orderByThroughList._orderBy).toStrictEqual(expectation.default);
    expect(defaultOrder._orderBy).toStrictEqual(expectation.default);
    expect(ascOrder._orderBy).toStrictEqual(expectation.asc);
    expect(descOrder._orderBy).toStrictEqual(expectation.desc);
    expect(numberedOrder._orderBy).toStrictEqual(expectation.numbered);
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

  it('subquery on self', () => {
    const query = Select(Person).where(({id}) => exists(Select(alias(Person, 'person_filter')).where(({id: _}) => _.eq(id))));

    const expectation = {
      _where: [{
        "_operands": [{
          "_alias": "person_filter",
          "_columns": [
            { "_column": { name: 'id', table: 'person_filter' }},
            { "_column": { name: 'uid', table: 'person_filter' }},
            { "_column": { name: 'name', table: 'person_filter' }},
            { "_column": { name: 'age', table: 'person_filter' }},
            { "_column": { name: 'city', table: 'person_filter' }},
          ],
          "_distinct": false,
          "_for": undefined,
          "_table": Person[TableMetadataSymbol],
          "_type": "SELECT",
          "_where": [{
            "_operands": [{
              "_column": { "name": "id", "table": "person_filter", },
            }, {
              "_column": { "name": "id", "table": "Person", },
            }],
            "_operator": "=",
          }]
        }],
        "_operator": "EXISTS",
      }]
    };

    expect(query._where).toStrictEqual(expectation._where);
  })

  it ('sum of subqueries', () => {
    @dbTable('actions')
    class PersonAction {
      @dbField public personId!: number;
      @dbField public action!: string;
      @dbField public created!: Date;
    }

    const ts = new Date(Date.now() - 3600);

    const query = Select(Person)
      .columns(({uid}) => [
        uid,
        alias(
          Select(PersonAction)
            .columns(() => [count()])
            .where(({personId, action, created}) => and(
              personId.eq(of(Person, 'id')),
              action.eq('a'),
              created.gte(ts)
            ))
            .asScalar()
          .mul(1).add(
            Select(PersonAction)
              .columns(() => [count()])
              .where(({personId, action, created}) => and(
                personId.eq(of(Person, 'id')),
                action.eq('b'),
                created.gte(ts)
              ))
            .asScalar().mul(100),
          ).add(
            Select(PersonAction)
              .columns(() => [count()])
              .where(({personId, action, created}) => and(
                personId.eq(of(Person, 'id')),
                action.eq('c'),
                created.gte(ts)
              ))
            .asScalar().mul(100),
          ),
          'score'
        )
    ]).orderBy(() => [desc(of(null, 'score'))])

    const expected = [{"_column": {"table": "Person", "name": "uid"}}, {
      "_alias": "score", "_operands": [{
        "_operator": "+", "_operands": [{
          "_operator": "+",
          "_operands": [{
            "_operator": "*",
            "_operands": [{
              "_operator": "SUBQUERY",
              "_operands": [{
                "_type": "SELECT",
                "_table": PersonAction[TableMetadataSymbol],
                "_alias": null,
                "_distinct": false,
                "_for": undefined,
                "_columns": [{"_func": "COUNT", "_args": ["*"]}],
                "_where": [{
                  "_operator": "AND",
                  "_operands": [{
                    "_operator": "=",
                    "_operands": [{"_column": {"table": "actions", "name": "personId"}}, {
                      "_column": {
                        "table": "Person",
                        "name": "id"
                      }
                    }]
                  }, {
                    "_operator": "=",
                    "_operands": [{"_column": {"table": "actions", "name": "action"}}, "a"]
                  }, {
                    "_operator": ">=",
                    "_operands": [{"_column": {"table": "actions", "name": "created"}}, ts]
                  }]
                }]
              }]
            }, 1]
          }, {
            "_operator": "*",
            "_operands": [{
              "_operator": "SUBQUERY",
              "_operands": [{
                "_type": "SELECT",
                "_table": PersonAction[TableMetadataSymbol],
                "_alias": null,
                "_distinct": false,
                "_for": undefined,
                "_columns": [{"_func": "COUNT", "_args": ["*"]}],
                "_where": [{
                  "_operator": "AND",
                  "_operands": [{
                    "_operator": "=",
                    "_operands": [{"_column": {"table": "actions", "name": "personId"}}, {
                      "_column": {
                        "table": "Person",
                        "name": "id"
                      }
                    }]
                  }, {
                    "_operator": "=",
                    "_operands": [{"_column": {"table": "actions", "name": "action"}}, "b"]
                  }, {
                    "_operator": ">=",
                    "_operands": [{"_column": {"table": "actions", "name": "created"}}, ts]
                  }]
                }]
              }]
            }, 100]
          }]
        }, {
          "_operator": "*",
          "_operands": [{
            "_operator": "SUBQUERY",
            "_operands": [{
              "_type": "SELECT",
              "_table": PersonAction[TableMetadataSymbol],
              "_alias": null,
              "_distinct": false,
              "_for": undefined,
              "_columns": [{"_func": "COUNT", "_args": ["*"]}],
              "_where": [{
                "_operator": "AND",
                "_operands": [{
                  "_operator": "=",
                  "_operands": [{"_column": {"table": "actions", "name": "personId"}}, {
                    "_column": {
                      "table": "Person",
                      "name": "id"
                    }
                  }]
                }, {
                  "_operator": "=",
                  "_operands": [{"_column": {"table": "actions", "name": "action"}}, "c"]
                }, {
                  "_operator": ">=",
                  "_operands": [{"_column": {"table": "actions", "name": "created"}}, ts]
                }]
              }]
            }]
          }, 100]
        }]
      }]
    }];

    expect(query._columns).toStrictEqual(expected);

    expect(query._orderBy).toStrictEqual([{
      _column: {
        name: 'score',
      },
      _order: "DESC",
      _nulls: undefined
    }]);
  })

  it ('invalid sub queries', () => {
    try {
      Select(Person).columns(['age', 'uid']).asScalar();
      fail('expected to throw');
    } catch (e) {
      // ignore
    }
  });

  it ('union operator', () => {
    const query = Select(Person)
      .columns(['name'])
      .union(true, Select(Person)
        .columns(['name'])
        .where(x => x.age.lt(18))
      )
      .where(x => x.age.gte(18))
      .orderBy(['name']);

    expect(query._operators).toStrictEqual([{
      _operator: 'UNION',
      _distinct: true,
      _operand: {
        "_type": "SELECT",
        "_table": Person[TableMetadataSymbol],
        "_alias": null,
        "_distinct": false,
        "_for": undefined,
        "_columns": [{"_column": {"table": "Person", "name": "name"}}],
        "_where": [{
          "_operator": "<",
          "_operands": [
            {"_column": {"table": "Person", "name": "age"}},
            18
          ]
        }]
      }
    }])
  })

  it('CASE operator', () => {
    const query = Select(Person)
      .columns(x => [alias(case_({when: x.age.gte(2), then: 'yes'}, {else: 'no'}), 'dynamic')])

    expect(query._columns).toStrictEqual([{
      "_alias": "dynamic",
      "_operands": [{
        "_operator": "CASE",
        "_operands": [
          {
            "when": {
              "_operator": ">=",
              "_operands": [
                { "_column": {"name": "age", "table": "Person"}},
                2
              ]
            },
            "then": "yes",
          },
          {"else": "no"}
        ]
      }]
    }])
  })

  it ('intersect operator', () => {
    const query = Select(Person)
      .columns(['name'])
      .intersect(Select(Person)
        .columns(['name'])
        .where(x => x.age.lt(18))
      )
      .where(x => x.age.gte(18))
      .orderBy(['name']);

    expect(query._operators).toStrictEqual([{
      _operator: 'INTERSECT',
      _distinct: false,
      _operand: {
        "_type": "SELECT",
        "_table": Person[TableMetadataSymbol],
        "_alias": null,
        "_distinct": false,
        "_for": undefined,
        "_columns": [{"_column": {"table": "Person", "name": "name"}}],
        "_where": [{
          "_operator": "<",
          "_operands": [
            {"_column": {"table": "Person", "name": "age"}},
            18
          ]
        }]
      }
    }])
  })

  it ('except operator', () => {
    const query = Select(Person)
      .columns(['name'])
      .except(Select(Person)
        .columns(['name'])
        .where(x => x.age.lt(18))
      )
      .where(x => x.age.gte(18))
      .orderBy(['name']);

    expect(query._operators).toStrictEqual([{
      _operator: 'EXCEPT',
      _distinct: false,
      _operand: {
        "_type": "SELECT",
        "_table": Person[TableMetadataSymbol],
        "_alias": null,
        "_distinct": false,
        "_for": undefined,
        "_columns": [{"_column": {"table": "Person", "name": "name"}}],
        "_where": [{
          "_operator": "<",
          "_operands": [
            {"_column": {"table": "Person", "name": "age"}},
            18
          ]
        }]
      }
    }])
  })

  it('COUNT unique', () => {
    const query = Select(Person)
      .columns(x => [count(x.id, true)]);

    expect(query._columns).toStrictEqual([{
      _func: "COUNT",
      _args: [
        "DISTINCT",
        {
          _column: {
            name: 'id',
            table: 'Person'
          }
        }
      ]
    }])
  });

  it('SELECT over subquery', () => {
    const query = Select(
        Select(Person)
          .columns(x => [count(x.id)])
          .groupBy(x => [x.age])
      )
      .columns(() => [count(undefined, true)]);

    expect(query).toStrictEqual({
      "_alias": "Person_SUBQUERY",
      _columns: [{
        _func: "COUNT",
        _args: [
          "DISTINCT",
          '*'
        ]
      }],
      "_distinct": false,
      "_for": undefined,
      "_table": {
        "_alias": null,
        "_columns": [{
          "_func": "COUNT",
          "_args": [{
            "_column": {
              "name": "id",
              "table": "Person",
            }
          }]
        }],
        "_distinct": false,
        "_for": undefined,
        "_groupBy": [{
          "_column": {
            "name": "age",
            "table": "Person",
          }
        }],
        "_table": Person[TableMetadataSymbol],
        "_type": "SELECT",
        "fields": new Map,
        "tableName": "Person_SUBQUERY",
      },
      "_type": "SELECT",
    })
  });

  // it('Select with lookup field', () => {
  //   const np = new NamedParameter('keyNP')
  //   @dbTable('other_table')
  //   class SubModel {
  //     @dbField({primaryKey: true})
  //     id!: number;
  //     @dbField
  //     key!: number;
  //     @dbField
  //     value!: Date;
  //   }
  //   @dbTable('person')
  //   class Person {
  //     @dbField({primaryKey: true})
  //     id!: number;
  //     @dbField
  //     value!: string;
  //     @dbLookupField<Person, SubModel>({
  //       model: Date,
  //       nullable: true,
  //       source: 'value',
  //       relation: SubModel,
  //       where(prime, other) {
  //         return and(
  //           prime.id.eq(other.id),
  //           other.key.eq(np)
  //         )
  //       }
  //     })
  //     lastAccess!: Date | null
  //   }
  //
  //   const query = Select(Person)
  //     .where(x => x.lastAccess.neq(null));
  //
  //   expect(query).toStrictEqual({
  //     "_alias": null,
  //     "_type": "SELECT",
  //   })
  // })
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
      id: person.id,
      name: person.name,
      age: person.age,
      city: person.city,
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
        id: person.id,
        name: person.name,
        age: person.age,
        city: person.city,
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
        id: person.id,
        name: person.name,
        age: person.age,
        city: person.city,
      },
      where: [{
        _operator: '=',
        _operands: [{_column: {table: tableName, name: 'id'}}, person.id]
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
      _operands: [{_column: {table: tableName, name: 'id'}}, person.id]
    }];
    expect(query._where).toStrictEqual(expectation);
    expect(query._limit).toBe(limit);
  });
});
