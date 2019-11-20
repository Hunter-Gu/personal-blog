---
title: JavaScript 中的二进制操作 --- ArrayBuffer & TypedArray & DataView
date: 2019-11-11 20:00:36
tags: browser
categories: Frontend
---

[上篇文章](/personal-blog/2019/11/07/blob-api/#more)中提到了 `FileReader` API， 它有一个 `readAsArrayBuffer()` 方法， 用于把数据读取为 `ArrayBuffer` 类型， 那么什么是 `ArrayBuffer` 呢？

## [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)

`ArrayBuffer` 用于表示**固定长度**的原始二进制数据缓冲区。

注意*其长度是固定*的， 你一定知道 JavaScript 中 `Array` 存储的对象能动态增多和减少， 但是在某些场景下（如 WebGL、 处理多媒体数据等） `Array` 的执行速度慢并且内存占用又大， 所以需要一种更高效的方式 --- `ArrayBuffer`。

另外还有一点要注意， 既然是**原始二进制数据缓冲区**， 那么就意味着 `ArrayBuffer` 不能被直接操作， 在 JavaScript 中需要通过 `TypedArray` 或 `DataView` 这两种视图来操作。

也就是说， 通过 `ArrayBuffer` 就像一间上锁的屋子把数据存储在里面， 通过 `TypedArray` 或 `DataView` 这两把钥匙才可以打开这间屋子， 拿到里面的东西。

## [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)

某种类数组对象的统称， 用于描述底层的二进制数据缓冲区。 包含如下构造函数：

二进制带符号整数：

- `Int8Array()`： 8 位，  -2^7 ~ (2^7 - 1)
- `Int16Array()`： 16 位， -2^15 ~ (2^15 - 1)
- `Int32Array()`： 32 位， -2^31 ~ (2^31 - 1)

无符号整数：

- `Uint8Array()`： 8 位， 0 ~ (2^8 - 1)
- `Uint16Array()`： 16 位， 0 ~ (2^16 - 1)
- `Uint32Array()`： 32 位， 0 ~ (2^32 - 1)

浮点数：

- `Float32Array()`： 32 位
- `Float64Array()`： 64 位

无符号整型固定：

- `Uint8ClampedArray()`： 值固定在 0-255 区间的 8 位无符号整型组成的数组
  - 如果值在 [0,255] 区间外， 将被替换为 0 或 255
  - 如果指定一个非整数， 将被设置为最接近它的整数
  - 对于处理 `Canvas` 的数据非常有用

## [`DataView`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView)

一个可以从 `ArrayBuffer` 对象中读写混杂着多种数值类型的底层接口， 使用时不需要考虑平台的字节顺序问题。

也就是说， 通过 `TypedArray` 读写简单类型的二进制数据， 通过 `DataView` 读写复杂类型的二进制数据。
