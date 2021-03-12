import { reader, IQueryData } from '../dist';
import { Person } from './models';
import { Container } from 'inversify';

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

  it('readMany plain', () => {
    const result = reader(persons);
    expect(result).toStrictEqual(persons);
    result.map(person => {
      expect(person).toBeInstanceOf(Person);
      expect(person).toStrictEqual(persons.find(p => p.id === person.id))
    });
  });

  it('readMany', () => {
    const result = reader(persons.map(x => JSON.parse(JSON.stringify(x))), Person);
    expect(result.length).toBe(persons.length);
    result.map(person => {
      expect(person).toBeInstanceOf(Person);
      expect(person).toStrictEqual(persons.find(p => p.id === person.id))
    });
  });

  it('readCount', () => {
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
