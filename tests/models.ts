import { dbField, dbTable, IDbField } from '../src';

const UUID: IDbField = {}

@dbTable('Person', [{name: 'id', fields: ['id']}])
export class Person {
  @dbField({
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @dbField({
    kind: UUID
  })
  uid?: string;

  @dbField
  name!: string;

  @dbField
  age!: number;

  @dbField
  city!: string;
}

@dbTable('Employee')
export class Employee {

  @dbField
  personId!: number;

  @dbField
  company!: string;

  @dbField
  salary!: number;
}
