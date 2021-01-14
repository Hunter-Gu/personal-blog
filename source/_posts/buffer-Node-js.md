---
title: buffer - Node.js
date: 2021-01-13 21:18:49
tags: Node.js
categories: Frontend
---

`Node.js` 中的 `buffer` 表示固定长度的字节序列（8位），用于处理原始数据。`Node.js` 中的大部分标准库（如 `fs`, `net`, `http`）都默认返回 `buffer` 类型的数据。

## 基础

### 创建 `buffer`

- `Buffer` 已废弃

```js
new Buffer()
```

- `Buffer.alloc()` 分配指定大小的新 `buffer`，并对内容进行初始化（通过`buf.fill()`）

```js
// 能确保新创建的 Buffer 实例的内容不会包含先前分配的敏感数据
Buffer.alloc(size[, fill[, encoding]])
Buffer.alloc(5) // <Buffer 00 00 00 00 00>
```

- `Buffer.allocUnsafe(size)` 
  - 内容未初始化，可能包含敏感数据
  - 和 `Buffer.alloc()`相比性能更好，有利于提高内存使用率
- `Buffer.from()`

### 比较两个 `buffer`

- `buffer.equals()` 比较两个` buffer` 具有完全相同的字节

```js
const buf1 = Buffer.from(['A'])
const buf2 = Buffer.from(['A'])

// 两个 buffer 具有完全相同的字节
buf1.equals(buf2) // true
```

- `buffer.compare()` 主要用于排序场景，返回 1, 0, -1 。

```js
const buf1 = Buffer.from(['A'])
const buf2 = Buffer.from(['A'])
const arr = [buf1, buf2]; 

b1.compare(b2) // 0
arr.sort((b1, b2) => b1.compare(b2))
```

### 截取

- `buffer.subarray()` 返回新的 Buffer，但引用与原始的 Buffer 相同的内存。继承自 `TypedArray`

- `buf.slice(start, end)` 和 `buf.subarray()` 功能完全相同，但继承自 `Uint8Array`

### CRUD API

- `buf.write()`

- `buf.fill()`

- `buf.copy()`

- `buf.indexOf()`

- `buf.includes()`

- `buf.readXxx()`

  - BE 大端序：高位数据存在低位
  - LE 小端序：低位数据存在低位

  ```js
  const buf = new Buffer.alloc(2)
  
  // 低位数据
  buf[0] = 0x3
  // 高位数据
  buf[1] = 0x4
  
  buf.readUInt16BE(0); // 0x0304
  buf.readUInt16LE(0); // 0x0403
  ```

### 数组特性

- `buf.length`  返回字节数
- `buf[index]`
- `buf.keys()`
- `buf.values()`
- `buf.entries()`
- `for ... of`

### `buffer` 特性

- `Buffer.byteLength(string[, encoding])` 获取字符串的字节长度

- `Buffer.isBuffer()`
- `Buffer.isEncoding()` 判断 `buffer` 是否支持该编码

## 编码 & 解码

### character encoding

常见的字符编码有：`utf8`, `binary`, `ascii`, ...

- 编码： 字符串 -> `buffer`
- 解码：`buffer` -> 字符串

```js
// 编码:
const buf2 = Buffer.from('Hello World', 'utf8')

// 解码
buf2.toString('utf8') // 'Hello World'
```

### binary-to-text encoding

文本二进制编码：常见的有 `base64`, `hex`。表示使用可打印字符表示二进制数据。

- 编码：buffer -> 字符串
- 解码: 字符串 -> buffer

```js
// 编码: buffer -> 字符串
const base64Str = Buffer.from('Hello World').toString('base64')

Buffer.from(base64Str, 'base64').toString() // 'Hello World'
```

> 主要用于有些协议/通道不支持二进制数据的场景，如 email 或 NNTP。

## `buffer` 池

`Node.js` 内部有 `buffer` 池，存放预分配的 `buffer`：

- 使用 `Buffer.allocUnsafe(size)` 方法时，如果 `size <= (Buffer.poolSize >> 1)`，就会使用该 `bufer` 池中预分配的 `buffer` ，避免创建太多独立的 `buffer` 导致 GC 过度使用（该方法可以提高性能和内存使用率的原因）。
- `Buffer.allocUnsafeSlow()` 不使用内部的 `buffer` 池
- `Buffer.poolSize`: 设置 `buffer` 池中预分配的 `buffer` 实例的大小，默认 `8KB`。
- `Buffer.from()` 和 `Buffer.concat()` 都利用 `buffer` 池。

## TODO

- Buffer < Uint8Array 

- Buffer < TypedArray

- & ArrayBuffer & sharedArrayBuffer