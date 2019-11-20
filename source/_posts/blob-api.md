---
title: 聊聊浏览器的 Blob API
date: 2019-11-07 20:59:09
tags: browser
categories: Frontend
---

`Blob` 在浏览器中用于表示二进制类型的大对象， 典型的有图片、 音频或其他多媒体对象。

```js
const blob = new Blob(['hello world'], {
  type: 'text/plain', // [MIME](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
  endings: 'native' // transparent
})
```

通过 `Blob` 与其他 API 结合， 可以实现很多实用的功能， 我们先看看这些 API。

## [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL)

`URL` API 是一个用于创建 URLs 的对象：

```js
new URL('http://test.nail.com:8080/test?a=1&b=2#c')
// {
//   hash: "#c",
//   host: "test.nail.com:8080",
//   hostname: "test.nail.com",
//   href: "http://test.nail.com:8080/test?a=1&b=2#c",
//   origin: "http://test.nail.com:8080",
//   password: "",
//   pathname: "/test",
//   port: "8080",
//   protocol: "http:",
//   search: "?a=1&b=2",
//   searchParams: URLSearchParams {},
//   username: "",
//   ...
// }
```

可以看到， 即使不了解这个 API， 我们仍旧会对返回的结果感觉比较熟悉。 `URL` 有如下静态方法：

### `URL.createObjectURL(Blob blob)`

这是一个经常会和 `Blob` 一起使用的方法， 接收一个 `Blob` 对象作为参数， 返回一个 blob 链接（如 "blob:http://test.nail.com:8080/xxxxxxx"）。

### `URL.revokeObject()`

将通过 `URL.createObjectURL()` 创建的 blob 链接销毁。

## [`FileReader`](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

`FileReader` API 赋予了我们在浏览器中**异步**读取本地文件的能力， 通过 `Blob` 或 `File` 对象指定要读取的文件或数据。

```js
const reader = new FileReader()

reader.onload = function(evt) {
  const { result } = evt.target
  console.log(result)
  // ...
}
reader.readAsDataURL(new Blob(['hello world']))
// data:application/octet-stream;base64,aGVsbG8gd29ybGQ=
```

### `FileReader.prototype.readAsXxx()`

通过该方法可以读取指定 `Blob` 中的内容， 一旦完成， 在 `onload` 事件对象的 `result` 属性中， 将包含指定格式的数据对象：

- `readAsArrayBuffer()`: 读取结果是 `ArrayBuffer` 数据对象类型
- `readAsBinaryString()`: 读取结果是文件的原始二进制数据
- `readAsDataURL()`: 读取结果是 Base64 字符串
- `readAsText()`: 读取结果是文件内容的字符串形式

### `onload` 事件

`onload` 事件在读取操作完成时触发， 是使用 `FileReader` 时最常涉及的。

## [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)

说到 `Blob` 就顺带提一下 `File`， `File` API 基于 `Blob` 并且提供一些有关文件的信息。

一般而言， 用户在 `<input>` 元素上选择文件后， 返回的 [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) 对象就是由 `File` 对象组成的列表。

在了解这些 API 后， 就可以与 `Blob` API 结合， 来实现一些有趣的功能了。

## 通过 Blob URL 隐藏真实链接

以图片为例：

```js
function getBlobByUrl(url) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.responseType = 'blob'
    xhr.onload = (evt: any) => {
      resolve(evt.target.response)
    }
    xhr.send()
  })
}

function getImageBlobUrl(imgUrl: any) {
  return getBlobByUrl(imgUrl).then((blob: any) => {
    const blobUrl = URL.createObjectURL(blob)
    const img = new Image()
    img.src = blobUrl
    img.onload = URL.revokeObjectURL.bind(URL, blobUrl)
    return blobUrl
  })
}
```

通过该方式获取到图片链接对应的 Blob URL 后， 用户就无法获取图片实际的 URL 了， 对于 `audio`, `video` 等资源也是同理。

上面代码中可以看到， 需要等待数据加载完后才可使用。 对于 `video` 这样比较大的资源， 那等待时间就会很长， 所以需要通过**流媒体**来解决问题。

## 生成 [Data URLs](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/data_URIs)

通过 `Blob` 配合 `FileReader` 可以将图片转换为 Data URLs 的形式：

```js
function readBlobAsDataURL(blob) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = function(evt) {
      resolve(evt.target.result)
    }
    reader.readAsDataURL(blob)
  })
}

function getDataURLByUrl(url) {
  return getBlobByUrl(url)
    .then(blob => {
      return readBlobAsDataURL(blob)
    })
}
```

通过上面两种方式， 还可以实现在浏览器中预览本地图片的功能。
