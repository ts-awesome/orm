import {dbField, dbTable, IDbField, dbFilterField, and, Select, DbValueType, IOperandable, cast} from '../src';

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

  @dbField({sensitive: true, nullable: true})
  password?: string;

  @dbFilterField({
    table: 'employee',
    keyField: 'person',
    valueField: 'title',
  })
  profiles?: string[];

  @dbFilterField(primary => Select(Tag)
      .columns((x) => [x.name])
      .join(TagPerson, (a ,b) => and(a.id.eq(b.tag), b.person.eq(primary)))
  )
  tags?: string[];
}

@dbTable('Tag')
export class Tag {
  @dbField({
    primaryKey: true,
    autoIncrement: true
  })
  public id!: number;
  @dbField public name!: string;
}

@dbTable('TagPerson')
export class TagPerson {
  @dbField({
    primaryKey: true,
  })
  public person!: number;
  @dbField({
    primaryKey: true,
  })
  public tag!: number;
}

@dbTable('Employee')
export class Employee {
  @dbField personId!: number;
  @dbField company!: string;
  @dbField salary!: number;
}

export const EMAIL: IDbField = {
  reader(value: DbValueType) {
    return typeof value === 'string' ? value.toLowerCase() : value
  },
  writer(value): DbValueType {
    return typeof value === 'string' ? value.toLowerCase() : value
  },
  readQuery(name: IOperandable<string>): IOperandable<string> {
    return cast(name as never, 'Email');
  },
  writeQuery(name: IOperandable<string>): IOperandable<string> {
    return cast(name as never, 'Email');
  }
}

export class MailingList {
  @dbField({
    primaryKey: true,
    autoIncrement: true
  })
  public id!: number;
  @dbField public name!: string;
  @dbField({kind: EMAIL}) email!: string;
}
