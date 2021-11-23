import { dbField, dbTable, IDbField, dbFilterField } from '../dist';

const UUID: IDbField = {}

@dbTable('Person', [{name: 'idx', fields: ['id']}])
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

  @dbField name!: string;
  @dbField age!: number;
  @dbField city!: string;

  @dbFilterField({
    table: 'employee',
    keyField: 'person',
    valueField: 'title',
  })
  profiles: string[];
}

@dbTable('Employee')
export class Employee {
  @dbField personId!: number;
  @dbField company!: string;
  @dbField salary!: number;
}
