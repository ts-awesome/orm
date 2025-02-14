import { reader, IQueryData, dbTable, IDbField, dbField, DbValueType } from '../dist';
import { Person } from './models';

const DB_JSON: IDbField = {
  reader(raw: DbValueType): any {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  },
  writer(value: any): DbValueType {
    return JSON.stringify(value);
  }
};

function generatePersons(quantity: number): IQueryData[] {
  const res = [];
  for (let i = 1; i <= quantity; i++) {
    const person = new Person();
    person['id'] = i;
    person['city'] = `TestCity${i}`;
    person['age'] = 18;
    person['name'] = `TestName${i}`;
    person['uid'] = `uid${i}`;
    // person['profiles'] = ['profile-a'];
    res.push(person);
  }
  return res;
}

describe('DbReader', () => {

  const persons = generatePersons(5);

  it('read raw', () => {
    const result = reader(persons);
    expect(result).toStrictEqual(persons);
    result.map(person => {
      expect(person).toBeInstanceOf(Person);
      expect(person).toStrictEqual(persons.find(p => p.id === person.id))
    });
  });

  it('read Model', () => {
    @dbTable
    class Model {
      @dbField public readonly id!: number;
      @dbField('raw') public readonly value!: string;
      @dbField({sensitive: true, nullable: true}) public readonly password?: string;
      @dbField({kind: DB_JSON, model: [Person]}) public readonly personal!: Person[];

      constructor(id, raw, personal) {
        this.id = id;
        this.value = raw;
        this.personal = personal
      }
    }

    const model = {
      id: "5",
      raw: false,
      personal: JSON.stringify(persons),
      password: 'test'
    }
    const expected = new Model(5, 'false', persons);

    const results = reader([model], Model);
    expect(results.length).toBe(1);
    const [result] = results;
    expect(result).toBeInstanceOf(Model);
    expect(result).toEqual(expected);
  });

  it('read Model incl sensitive', () => {
    @dbTable
    class Model {
      @dbField public readonly id!: number;
      @dbField('raw') public readonly value!: string;
      @dbField({sensitive: true, nullable: true}) public readonly password?: string;
      @dbField({kind: DB_JSON, model: [Person]}) public readonly personal!: Person[];

      constructor(id, raw, personal, password) {
        this.id = id;
        this.value = raw;
        this.personal = personal
        this.password = password
      }
    }

    const model = {
      id: "5",
      raw: false,
      personal: JSON.stringify(persons),
      password: 'test'
    }
    const expected = new Model(5, 'false', persons, 'test');

    const results = reader([model], Model, true);
    expect(results.length).toBe(1);
    const [result] = results;
    expect(result).toBeInstanceOf(Model);
    expect(result).toEqual(expected);
  });

  it('read Model from no data', () => {
    @dbTable
    class Model {
      @dbField public readonly id!: number;
      @dbField('raw') public readonly value!: string;
      @dbField({kind: DB_JSON, model: [Person]}) public readonly personal!: Person[];

      constructor(id, raw, personal) {
        this.id = id;
        this.value = raw;
        this.personal = personal
      }
    }

    const results = reader([], Model);
    expect(results.length).toBe(0);
  });

  it('read Object from no json', () => {
    @dbTable
    class Model {
      @dbField public readonly id!: number;
      @dbField('raw') public readonly value!: string;
      @dbField({kind: DB_JSON, model: Object, nullable: true}) public readonly some_other!: object | null;

      constructor(id, raw, some_other) {
        this.id = id;
        this.value = raw;
        this.some_other = some_other
      }
    }

    const results = reader([{id: "5", value: "test", some_other: JSON.stringify({hello: 2})}], Model);
    expect(results.length).toBe(1);
    expect(results[0]).toEqual({
      id: 5,
      value: "test",
      some_other: {hello: 2},
    })
  });

  it('read scalar', () => {
    const count = 10;
    const correctResult = reader([{field: count}], true);
    expect(correctResult).toBe(count);
  });

  it('read scalar from no data', () => {
    const fieldValue = 'string';
    const emptyData = reader([], true);
    expect(emptyData).toBe(0);
    expect(() => {
      reader([{field: fieldValue as any}], true)
    }).toThrowError(`Invalid scalar "${fieldValue}", number expected.`);
  });

  it('read scalar from invalid data', () => {
    const fieldValue = 'string';
    expect(() => {
      reader([{field: fieldValue as any}], true)
    }).toThrowError(`Invalid scalar "${fieldValue}", number expected.`);
  });
});
