---
title: Readable stream 和 Writable stream 的最佳实践
date: 2021-01-21 00:38:19
tags: Node.js
categories: Frontend
---

## `pipe()`

尽管可以单独使用 Writable stream 和 Readable stream，但是最有效的方法是将两者结合使用。

通过 `pipe()` 方法可以将 Writable stream 和 Readable stream 优雅的结合起来：

```js
const readable = fs.createReadStream('main.txt')
const zip = zlib.createGzip()
const writable = fs.createWriteStream('file.txt.gz')

// readable 的所有数据都会推送到 writable
readable.pipe(zip).pipe(writable)
```

`pipe()` 方法会**将 Readable stream 切换到 flowing 模式**，并将 Readable stream 的所有数据推送到绑定的 Writable stream。

不仅如此，`pipe()` 内置了很多细节：

- Writable stream 生产数据给 Readable stream, Readable stream 触发 `data` 事件
- 当 Writable stream 触发 `drain` 事件时，Readable stream 调用 `resume()` 方法
- 当 Readable stream 监听的 `data` 事件中，`write()` 方法返回了 `false`, 就会停止调用该方法
- 直到缓冲区中有可用空间，Writable stream 就会触发 `drain` 事件从而恢复读取数据

**数据流会以上述方式自动管理，所以即使 Readable stream 更快，目标 Writable stream 也不会超负荷**。

## `pipeline()`

stream 模块提供了 `pipeline()` 方法，相当于 Readable stream 的 `readable.pipe()` 方法：

```js
require('stream').pipeline(
  fs.createReadStream('main.txt'),
  zlib.createGzip(),
  fs.createWriteStream('file.txt.gz'),
  err => {
    if (err) {
      console.error('管道传送失败')
    } else {
      console.log('管道传送成功')
    }
  }
)
```
