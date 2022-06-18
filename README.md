# @ts-awesome/orm

TypeScript friendly minimalistic Object Relation Mapping library

Key features:

* strong object mapping with [@ts-awesome/model-reader](https://github.com/ts-awesome/model-reader)
* no relation navigation - intentional
* heavy use of type checks and lambdas
* support common subset of SQL

## Model declaration

Each model metadata is defined with `dbTable` and `dbField` decorators

```ts
import {dbField, dbField} from "@ts-awesome/orm";
import {DB_JSON} from "@ts-awesome/orm-pg"; // or other driver

@dbTable('first_table')
class FirstModel {
  // numeric autoincrement primary key
  @dbField({primaryKey: true, autoIncrement: true})
  public id!: number;

  // just another field
  @dbField
  public title!: string;

  // lets map prop to different field
  @dbField({name: 'author_id'})
  public authorId!: number;

  // nullable field requires explicit model and nullable
  // these are direct match to @ts-awesome/model-reader
  @dbField({
    model: String,
    nullable: true,
  })
  public description!: string | null;

  // advanced use case
  @dbModel({
    kind: DB_JSON, // data will be stored as JSON
    model: SubDocumentModel, // and will be converted to instance of SubDocumentModel
    nullable: true,
  })
  public document!: SubDocumentModel | null

  // readonly field with database default
  @dbField({name: 'created_at', readonly: true})
  public createdAt!: Date;
}
```

## Vanilla select

```ts
import {IBuildableQuery, IQueryExecutor, Select} from "@ts-awesome/orm";
import {ISqlQuery, PgCompiler} from "@ts-awesome/orm-pg"; // or other driver

const compiler = new PgCompiler();
const driver: IQueryExecutor<ISqlQuery>;

const query: IBuildableQuery = Select(FirstModel).where({authorId: 5}).limit(10);
const compiled: ISqlQuery = compiler.compile(query);
const results: FirstModel[] = await driver.execute(compiled, FirstModel);
```

For more streamlined use please check [@ts-awesome/entity](https://github.com/ts-awesome/model-reader) 

## Select builder

ORM provides a way to use model declaration to your advantage: TypeScript will check is fields exists.
And TypeScript will check operands for compatible types.

```ts
const query = Select(FirstModel)
  // authorId = 5;
  .where({authorId: '5'}) // gives error, it can be number only
  .limit(10);
```

For more complex logic ORM provides WhereBuilder

```ts
const query = Select(FirstModel)
  // authorId = 5;
  .where(({authorId}) => authorId.eq(5))
  .limit(10);
```

```ts
const query = Select(FirstModel)
  // authorId in (5, 6)
  .where(({authorId, description}) => authorId.in([5, 6])) 
  .limit(10);
```

```ts
const query = Select(FirstModel)
  // authorId = 5 AND description LIKE 'some%';
  .where(({authorId, description}) => and(authorId.eq(5), description.like('some%'))) 
  .limit(10);
```

#### Overview of operators and functions:
    
* Generic comparable: 
  * left.`eq`(right) equivalent to left `=` right or left `IS NULL` if right === null
  * left.`neq`(right) equivalent to left `<>` right or left `IS NOT NULL` if right === null
  * left.`gt`(right) equivalent to left `>` right
  * left.`gte`(right) equivalent to left `>=` right
  * left.`lt`(right) equivalent to left `<` right
  * left.`lte`(right) equivalent to left `<=` right  
  * left.`between`(a, b) equivalent left BETWEEN (a, b)
* Strings
  * left.`like`(right) equivalent to left `LIKE` right
* Arrays
  * left.`in`(right) equivalent to left `IN` right
  * left.`has`(right) equivalent to right `IN` left
* Math
  * left.`add`(right) equivalent to left `+` right
  * left.`sub`(right) equivalent to left `-` right
  * left.`mul`(right) equivalent to left `*` right
  * left.`div`(right) equivalent to left `/` right
  * left.`mod`(right) equivalent to left `%` right
* Binary logic
  * left.`and`(right) equivalent to left `&` right
  * left.`or`(right) equivalent to left `|` right
  * left.`xor`(right) equivalent to left `^` right
* Logic
  * `and`(op1, op2, op3) equivalent to op1 `AND` op2 `AND` op3
  * `or`(op1, op2, op3) equivalent to op1 `OR` op2 `OR` op3
  * `not`(op) equivalent to `NOT` op
* Subqueries
  * `all`(query) equivalent to `ALL` (compiled query)
  * `any`(query) equivalent to `ANY` (compiled query)
  * `exists`(query) equivalent to `EXISTS` (compiled query)
* Aggregation functions
  * `avg`(expr) equivalent to `AVG` (expr)
  * `max`(expr) equivalent to `MAX` (expr)
  * `min`(expr) equivalent to `MIN` (expr)
  * `sum`(expr) equivalent to `SUM` (expr)
  * `count`(expr) equivalent to `count` (expr)

### Joining

Sometimes you may need to perform some joins for filtering

```ts
import {dbTable, dbField} from "@ts-awesome/orm";

@dbTable('second_table')
class SecondModel {
  @dbField({primatyKey: true, autoIncrement: true})
  public id!: number;
  
  @dbField
  public name!: string;
}

const query = Select(FirstModel)
  // lets join SecondModel by FK
  .join(SecondModel, (root, other) => root.authorId.eq(other.id))
  // lets filter by author name
  .where(() => of(SecondModel, 'name').like('John%'))
  .limit(10)
```

In some cases `TableRef` might be handy, especially of need to join same table multiple times

```ts
import {dbTable, dbField} from "@ts-awesome/orm";

@dbTable('second_table')
class SecondModel {
  @dbField({primatyKey: true, autoIncrement: true})
  public id!: number;
  
  @dbField
  public name!: string;
}

@dbTable('third_table')
class ThirdModel {
  @dbField({primatyKey: true, autoIncrement: true})
  public id!: number;

  @dbField
  public createdBy!: number;
  
  @dbField
  public ownedBy!: number;
}

const ownerRef = new TableRef(SecondModel);
const creatorRef = new TableRef(SecondModel);
const query = Select(ThirdModel)
  // lets join SecondModel by FK
  .join(SecondModel, ownerRef, (root, other) => root.ownedBy.eq(other.id))
  // lets join SecondModel by FK
  .join(SecondModel, creatorRef, (root, other) => root.createdBy.eq(other.id))
  // lets filter by owner or creator name
  .where(() => or(
    of(ownerRef, 'name').like('John%'),
    of(creatorRef, 'name').like('John%'),
  ))
  .limit(10)
```

### Grouping

```ts
import {Select, min, count, alias} from '@ts-awesome/orm'

const ts: Date; // some timestamp in past
const query = Select(FirstModel)
  // we need titles to contain `key`
  .where(({title}) => title.like('%key%'))
  // group by authors
  .groupBy(['authorId'])
  // filter to have first publication not before ts 
  .having(({createdAt}) => min(createdAt).gte(ts))
  // result should have 2 columns: authorId and count
  .columns(({authorId}) => [authorId, alias(count(), 'count')])
```

### Ordering

```ts
import {Select, desc} from '@ts-awesome/orm'

const query = Select(FirstModel)
    // lets join SecondModel by FK
    .join(SecondModel, (root, other) => root.authorId.eq(other.id))
    // lets sort by author and title reverse
    .orderby(({title}) => [of(SecondModel, 'name'), desc(title)])
    .limit(10)
```

## Other builders

ORM provides `Insert`, `Update`, `Upset` and `Delete` builders

### Insert

```ts
import {Insert} from '@ts-awesome/orm';

const query = Insert(FirstModel)
  .values({
    title: 'New book'
  })
```

### Update

```ts
import {Update} from '@ts-awesome/orm';

const query = Update(FirstModel)
  .values({
    title: 'New book'
  })
  .where(({id}) => id.eq(2))
```

### Upsert

```ts
import {Upsert} from '@ts-awesome/orm';

const query = Upsert(FirstModel)
  .values({
    title: 'New book'
  })
  .where(({id}) => id.eq(2))
  // conflict resolution index is defined in @dbTable decorator
  .conflict('index_name')
```


### Delete

```ts
import {Delete} from '@ts-awesome/orm';

const query = Delete(FirstModel)
  .where(({authorId}) => authorId.eq(2))
```


# License
May be freely distributed under the [MIT license](https://opensource.org/licenses/MIT).

Copyright (c) 2022 Volodymyr Iatsyshyn and other contributors
