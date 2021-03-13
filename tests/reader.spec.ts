import { reader, IQueryData, dbTable, IDbField, dbField, DbValueType } from '../dist';
import { Person } from './models';
import { Container } from 'inversify';

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
    res.push(person);
  }
  return res;
}

describe('DbReader', () => {

  const persons = generatePersons(5);
  let container: Container;
  beforeEach(() => {
    container = new Container();
  });

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
      personal: JSON.stringify(persons)
    }
    const expected = new Model(5, 'false', persons);

    const results = reader([model], Model);
    expect(results.length).toBe(1);
    const [result] = results;
    expect(result).toBeInstanceOf(Model);
    expect(result).toEqual(expected);
  });

  it('read scalar', () => {
    const count = 10;
    const fieldValue = 'string';
    const emptyData = reader([], true);
    const correctResult = reader([{field: count}], true);
    expect(emptyData).toBe(0);
    expect(correctResult).toBe(count);
    expect(() => {
      reader([{field: fieldValue as any}], true)
    }).toThrowError(`Can\'t read count value from db. Invalid Count ${fieldValue}`);
  });
});
