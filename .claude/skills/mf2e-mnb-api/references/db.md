# db 模块

客户端本地 SQLite 数据库操作。适合需要在 App 内持久化结构化数据的场景。

> **注意**：`db.*` 接口的调用风格不统一——`createDB`、`createTable`、`updateTable`、`dropTable` 使用旧版**回调模式**；`query`、`closeDB` 使用 **Promise**；`insert`、`batchInsert`、`delete`、`update` 直接调用无需处理返回值。

---

## db.createDB

创建数据库。

### Options `object`

- `dbName` `string` — 数据库名称

```js
mnb('db.createDB', { dbName: 'my_db' }, (error, result) => {
  console.log(result)
})
```

---

## db.createTable

在指定数据库中创建表（建议使用 `IF NOT EXISTS` 避免重复创建报错）。

### Options `object`

- `dbName` `string` — 数据库名称
- `sqlCreateTable` `string` — 建表 SQL 语句

```js
mnb(
  'db.createTable',
  {
    dbName: 'my_db',
    sqlCreateTable:
      'CREATE TABLE IF NOT EXISTS user_table (userId TEXT, name TEXT, age TEXT)',
  },
  (error, result) => {
    console.log(result)
  },
)
```

---

## db.updateTable

修改表结构（如新增列）。

### Options `object`

- `dbName` `string` — 数据库名称
- `sqlUpdateTable` `string` — ALTER TABLE SQL 语句

```js
mnb(
  'db.updateTable',
  {
    dbName: 'my_db',
    sqlUpdateTable: 'ALTER TABLE user_table ADD COLUMN email TEXT',
  },
  (info) => {
    console.log(info)
  },
)
```

---

## db.dropTable

删除表。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `sqlQropTable` `string` — DROP TABLE SQL 语句（注意字段名是 `sqlQropTable`，非笔误）

```js
mnb(
  'db.dropTable',
  {
    dbName: 'my_db',
    tableName: 'user_table',
    sqlQropTable: 'DROP TABLE IF EXISTS user_table',
  },
  (info) => {
    console.log(info)
  },
)
```

---

## db.insert

插入单条记录。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `columnInfo` `object` — 字段键值对，key 为列名，value 为值

```js
mnb('db.insert', {
  dbName: 'my_db',
  tableName: 'user_table',
  columnInfo: {
    userId: 'u001',
    name: '张三',
    age: '28',
  },
})
```

---

## db.batchInsert

批量插入多条记录。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `columnInfos` `array` — 多条记录，每项结构同 `db.insert` 的 `columnInfo`

```js
mnb('db.batchInsert', {
  dbName: 'my_db',
  tableName: 'user_table',
  columnInfos: [
    { userId: 'u002', name: '李四', age: '25' },
    { userId: 'u003', name: '王五', age: '30' },
  ],
})
```

---

## db.delete

按条件删除记录。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `conditions` `array` — 查询条件列表
  - `operator` `string` — 操作符，如 `'='`、`'>'`、`'<'`
  - `field` `string` — 字段名
  - `value` `string` — 值

```js
mnb('db.delete', {
  dbName: 'my_db',
  tableName: 'user_table',
  conditions: [{ operator: '=', field: 'userId', value: 'u001' }],
})
```

---

## db.update

按条件更新记录。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `condition` `object` — 查找条件，键值对（精确匹配）
- `columnInfo` `object` — 要更新的字段键值对

```js
mnb('db.update', {
  dbName: 'my_db',
  tableName: 'user_table',
  condition: { userId: 'u002' },
  columnInfo: { name: '李四（已更新）', age: '26' },
})
```

---

## db.query

按条件查询记录，返回 Promise。

### Options `object`

- `dbName` `string` — 数据库名称
- `tableName` `string` — 表名
- `conditions` `array` — 同 `db.delete` 的 conditions；传空数组 `[]` 表示查全表

### Returns `array`

查询结果，每项为一条记录对象。

```js
// 条件查询
const results = await mnb('db.query', {
  dbName: 'my_db',
  tableName: 'user_table',
  conditions: [{ operator: '=', field: 'age', value: '28' }],
})
console.log(results) // [{ userId: 'u001', name: '张三', age: '28' }]

// 查全表
const all = await mnb('db.query', {
  dbName: 'my_db',
  tableName: 'user_table',
  conditions: [],
})
```

---

## db.closeDB

关闭数据库连接。

### Options `object`

- `dbName` `string` — 数据库名称

```js
await mnb('db.closeDB', { dbName: 'my_db' })
```

---

## 典型使用场景

```js
// 1. 初始化：创建库和表
mnb('db.createDB', { dbName: 'cache_db' }, async (err) => {
  if (err) return
  mnb('db.createTable', {
    dbName: 'cache_db',
    sqlCreateTable:
      'CREATE TABLE IF NOT EXISTS notes (noteId TEXT, title TEXT, updatedAt TEXT)',
  }, () => {})
})

// 2. 写入
mnb('db.insert', {
  dbName: 'cache_db',
  tableName: 'notes',
  columnInfo: { noteId: 'n001', title: '我的笔记', updatedAt: '2025-01-01' },
})

// 3. 查询
const notes = await mnb('db.query', {
  dbName: 'cache_db',
  tableName: 'notes',
  conditions: [],
})

// 4. 用完关闭
await mnb('db.closeDB', { dbName: 'cache_db' })
```
