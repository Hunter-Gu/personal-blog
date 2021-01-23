---
title: stream 的内部缓冲区
date: 2021-01-21 00:40:41
tags: Node.js
categories: Frontend
---

## `readable.readableBuffer` & `writable.writableBuffer`

Readable stream 和 Writable stream 内部都有缓冲区，分别通过 `readable.readableBuffer` 和 `writable.writableBuffer` 访问。

缓冲区的大小由 `highWaterMark` 选项决定。

## Readable stream

### `readable.push()`

用于**将数据推入内部的缓冲区**中供流消费，当没有数据可以继续写入时，传入 `null` 可表示流的结束（EOF）。

- 暂停模式时，使用 `readable.push()` 添加的数据可以在触发 `readable` 事件时通过调用 `readable.read()` 读取
- 流动模式时，使用 `readable.push()` 添加的数据可以通过触发 'data' 事件读取

> 当内部的可读缓冲没有可用空间时，Readable stream 会暂时停止从底层资源读取数据（停止调用 `readable._read()`），直到当前缓冲的数据被消费。

### `readable.read()`

用于从内部缓冲拉取并返回数据，如果没有可读的数据则返回 `null`。

**`readable.read()` 应该只对处于暂停模式的可读流调用**。流动模式下， `readable.read()` 会自动调用直到内部缓冲的数据完全耗尽。

## Writable stream

### `writable.write(chunk[, encoding][, callback])`

用于写入数据到 Writable stream 的缓冲区，在数据被完全处理之后调用 `callback` 参数。

- 当内部缓冲区仍有可用空间时，调用 `writable.write()` 会返回 `true`
- 当内部缓冲区没有可用空间时，调用 `writable.write()` 会返回 `false`，此时应该停止写入数据，直到触发 'drain' 事件

> 内部缓冲区大小由 `highWaterMark` 选项设置，所以即使没有可用的缓冲区，也可以调用 `writable.write()` 方法，Node.js 会缓冲所有写入的数据块，直到达到最大内存占用。
