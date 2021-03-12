import { DbReader, IDbDataReader } from '../src';
import { Person } from './models';
import { Container } from 'inversify';

function generatePersons(quantity: number): Person[] {
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
  let dbReader: IDbDataReader<Person>;
  beforeEach(() => {
    container = new Container();
    dbReader = new DbReader(Person);
  });

  it('readOne', () => {
    const result = dbReader.readOne([{...persons[0]}]);
    expect(result).toBeInstanceOf(Person);
    expect(result).toStrictEqual(persons[0]);
  });

  it('readOneOrRejectNotFound', () => {
    const result = dbReader.readOneOrRejectNotFound([persons[0] as any]);
    expect(result).toBeInstanceOf(Person);
    expect(result).toStrictEqual(persons[0]);
    expect(() => {
      dbReader.readOneOrRejectNotFound([])
    }).toThrowError('Not Found Error');
  });

  it('readMany', () => {
    const result = dbReader.readMany(persons as any);
    expect(result.length).toBe(persons.length);
    result.map(person => {
      expect(person).toBeInstanceOf(Person);
      expect(person).toStrictEqual(persons.find(p => p.id === person.id))
    });
  });

  it('readManyOrRejectNotFound', () => {
    const result = dbReader.readManyOrRejectNotFound(persons as any);
    expect(result.length).toBe(persons.length);
    result.map(person => {
      expect(person).toBeInstanceOf(Person);
      expect(person).toStrictEqual(persons.find(p => p.id === person.id))
    });
    expect(() => {
      dbReader.readManyOrRejectNotFound([]);
    }).toThrowError('Not Found Error');
  });

  it('readCount', () => {
    const count = 10;
    const fieldValue = 'string';
    const emptyData = dbReader.readCount([]);
    const correctResult = dbReader.readCount([{field: count}]);
    expect(emptyData).toBe(0);
    expect(correctResult).toBe(count);
    expect(() => {
      dbReader.readCount([{field: fieldValue as any}])
    }).toThrowError(`Can\'t read count value from db. Invalid Count ${fieldValue}`);
  });
});
