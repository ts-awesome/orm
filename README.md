# ts-orm

## @dbTable(
  * **`tableName`**: *`string`* - Table name
  * **`uniqueIndexes?[]`** - Array of uniqueIndexes meta
    * **`name`**: *`string`* - Index name
    * **`fields`**: *`string[]`* - Array of field related to index
    * **`default?`**: *`boolean`* - Determines used that index as a default in query like upsert
    * **`where?`**: *WhereBuilder* - Where condition that used in upsert query (This is specific for postgres db)

)

## @dbField({
  * **`name?`**: *`string`* - Field name. Use model property name by default.
  * **`primaryKey?`**: *`true`* - Is field primary key or not (*false by default*).
  * **`readonly?`**: *`true`* - Is field readonly (*false by default*).
  * **`autoIncrement?`**: *`true`* - Is field auto increment (*false by default*).
  * **`default?`**: *`T | DbDefault`* - Field has default value. Specify value or indicate db column has default with DbDefault
  * **`sensitive?`**: *`true`* - Fields contains sensitive data and will be masked with undefined (*false by default*)
  * **`kind?`**: *`IDbField | uuid | json | string | symbol`* - Field parser/serializer options

})

## @dbManyField({
  * **`table`**: *`string | TableClass`* - Name of related table.
  * **`keyField`**: *`string`* - Field from **table** that is matched with this table's primary key.
  * **`valueField`**: *`string`* - Related table's field that is used as a source of values.

})

## Example

```ts
@dbTable("user")
export class UserModel {

  @dbField({
    autoIncrement: true,
    primaryKey: true,
    name: "id"
  })
  id: number;

  @dbField({
    kind: 'uuid',
  })
  uid: string;

  @dbField("username")
  userName: string;

  @dbField({
    sensetive: true,
  })
  password: string;

  @dbField()
  email?: string | null;

  @dbField()
  type?: UserType;

  @dbField({
    name: 'creationdate',
    readonly: true,
  })
  creationDate?: Date;

  @dbField({
    name: 'lastmodified',
    readonly: true,
  })
  lastModified?: Date;

  @dbManyField({
    table: 'user_bus',
    keyField: 'userId',
    valueField: 'busId',
  })
  busIds?: number[];
}
```

### Setup your container and bindings with `@ts-awesome/orm-pg`

```ts
container.bind<pg.Pool>(Symbol.for('PgPool'))
  .toConstantValue(new pg.Pool({})); // TODO: provide db config

container
  .bind<IBuildableQueryCompiler<ISqlQuery>>(Symbols.SqlQueryCompiler)
  .to(PgCompiler);

container.bind<IQueryDriver<ISqlQuery>>(Symbols.SqlQueryDriver)
  .toDynamicValue(({container}: interfaces.Context) => {
    return new PgDriver(container.get<pg.Pool>(Symbol.for('PgPool')));
  });

container
  .bind<IDbDataReader<UserModel>>(Symbols.dbReaderFor(UserModel))
  .toConstantValue(new DbReader<UserModel>(UserModel));
```
