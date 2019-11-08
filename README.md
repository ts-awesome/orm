# ts-orm

## @dbTable(
  * **tableName**: *string* - Table name
  * **uniqueIndexes?[]** - Array of uniqueIndexes meta
    * **name**: *string* - Index name
    * **fields**: *string[]* - Array of field related to index
    * **default?**: *boolean* - Determines used that index as a default in query like upsert
    * **where?**: *WhereBuilder* - Where condition that used in upsert query (This is specific for postgres db)

)

## @dbField({
  * **name?**: *string* - Field name. Use model property name by default.
  * **primaryKey?**: *boolean* - Is field primary key or not (*false by default*).
  * **readonly?**: *boolean* - Is field readonly (*false by default*).
  * **autoIncrement?**: *boolean* - Is field auto increment (*false by default*).
  * **default?**: *T | DbDefault* - Field has default value. Specify value or indicate db column has default with DbDefault
  * **sensitive?**: *boolean* - Fields contains sensitive data and will be masked with undefined (*false by default*)
  * **kind?**: *IDbField | uuid | json | custom* - Field parser/serializer options
})

## @dbManyField({
  * **table**: *string | TableClass* - Name of related table.
  * **keyField**: *string* - Field from **table** that is matched with this table's primary key.
  * **valueField**: *string* - Related table's field that is used as a source of values.

})

