---
title: JavaScript 中的异步处理
date: 2019-04-11 19:39:38
categories: Frontend
tags: javascript
---

异步是 `JavaScript` 的一大特点, 使用 `JavaScript` 就会不可避免的需要处理异步, 监听用户的操作事件, 处理 `Ajax` 请求, 定时器等等都是异步场景。 所以很有必要好好地了解以及学习如何处理异步。

## 回调函数

ES6 之前, 只能通过回调函数的方式处理异步, 这是最原始的处理方式, 几乎所有原生 API 都是通过这种方式处理异步的, 如 `setTimeout()`, `addEventListener()` 等:

```js
setTimeout(fucntion () {
  console.log('1s later')
}, 1000)
```

上面的示例代码就是典型的回调函数方式, 当回调函数中又嵌套回调函数, 并且嵌套多层时, 就出现了**回调地狱(callback hell)**:

```js
setTimeout(function () {
  console.log('1s later')
  setTimeout(function () {
    console.log('2s later')
    setTimeout(function () {
      console.log('3s later')
      setTimeout(function () {
        console.log('4s later')
      }, 1000)
    }, 1000)
  }, 1000)
}, 1000)
```

回调地狱会导致代码可读性非常差, 也会造成难以维护的问题。 上面的代码可读性很差, 语义不明确。

## `Promise`

`Promise` 是 ES6 中添加的新特性, 专门用于处理异有效, 具体的语法可以参考 [ECMAScript 6 但是只适用于回调函数时最后一个参数, 并且回调函数的参数只有(http://es6.ruanyifeng.com/#docs/promise), 通过 `Promise` 可以将上面的代码优化成这样:

```js
new Promise(function (resolve, reject) {
  setTimeout(function () {
    console.log('1s later')
    resolve()
  }, 1000)
}).then(function () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}).then(function () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}).then(function () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
})
```

这么写整体而言比回调方式好的多了, 整个流程比较清晰, 但是缺点就是太啰嗦, 可以通过 `Promise Chain` 的方式进行优化。

### `Promise` Chain

`Promise` Chain 可以将 Promise 按照顺序形成链式调用, 并且只有在前一个 `Promise` 的状态变为 fulfilled 之后, 后一个 `Promise` 才会执行。

`Promise` Chain 的实现一般有两种方式：

- 通过数组实现 `Promise` Chain
- 通过递归实现 `Promise` Chain

#### 数组实现

```js
class PromiseChain {
  constructor () {
    this.promise = Promise.resolve()
    this.chain = []
  }

  use (node) {
    this.chain.push(node)
    return this
  }

  exec (...params) {
    this.chain.forEach(node => {
      this.promise = this.promise.then(() => {
        return node()
      })
    })
  }
}
```

使用示例:

```js
const promiseChain = new PromiseChain()

promiseChain
  .use(after1Sec)
  .use(after2Sec)
  .use(after3Sec)
  .use(after4Sec)
  .exec()

function after1Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('1s later')
      resolve()
    }, 1000)
  })
}

function after2Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}

function after3Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}

function after4Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
}
```

#### 递归实现

```js
function asyncQueue (array) {
  return (function exec (i) {
    if (i === array.length) return Promise.resolve()

    return array[i]().then(function () {
      return exec(i + 1)
    })
  })(0)
}
```

使用示例:

```js
const arrayP = [after1Sec, after2Sec, after3Sec, after4Sec]

asyncQueue(arrayP)

function after1Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('1s later')
      resolve()
    }, 1000)
  })
}

function after2Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}

function after3Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}

function after4Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
}
```

### 通过 `Promise` 实现 Observer

```js
function waitForClick (element) {
  let res = null
  const handler = () => res && res()

  element.addEventListener('click', handler)

  return new Promise(function (resolve, reject) {
    res = resolve
  }).then(() => {
    element.removeElementListener('click', handler)
  })
}

waitForClick(btn).then(() => {
  console.log('after click')
})

Promise.all([waitForClick(btn1), waitForClick(btn2), waitForClick(btn3)])
```

上面示例中的 `waitForClick()` 就有点类似于 Observer, 并且将 click 事件的监听与事件处理的逻辑解耦了, 整体可读性更好。

### Promisify

既然所有的回调都可以用 `Promise` 重写, 那么就可以写一个公共的 `promisify()` 函数, 将回调风格变为 `Promise` 风格:

```js
function promisify (cb, context) {
  return function () {
    const args = arguments
    return new Promise(function (resolve, reject) {
      cb.call(context, ...args, function (err, value) {
        !!err ? reject(err) : resolve(value)
      })
    })
  }
}
```

接着测试一下上面的 `promisify()` 函数:

```js
function testCb (err, value, cb) {
  setTimeout(function () {
    cb(err, value)
  }, 1000)
}

testCb(1, 2, function (err, value) {
  console.log(err, value)
})

const testP = promisify(testCb)
testP(1, 2).then(res => {
  console.log(res)
}).catch(err => {
  console.log(err)
})
```

上面的 `promisify()` 函数相对而言比较通用, 但是只适用于**回调函数是最后一个参数**, 并且回调函数的**参数满足以下条件**时才有效:

- 第一个值是 `Error` 对象, 表示是否出错, 未出错时值为 `null`;
- 第二个值是正确的值

这是 `NodeJS` 中回调函数的参数的风格, 即 Error First, 所以该方法在 `NodeJS` 中会非常通用。

但是在浏览器端就不一定了。 比如 `setTimeout()`, `setInterval()` 的回调函数是第一个参数, 但是对 `addEventListener()` 等又是最后一个参数。 所以我们在自己设计回调接口时, 都应该按照 Error First 的风格进行设计, 以使得整体风格的一致。

## `Generator`

`Generator` 同样是在 ES6 新增的新特性, 是异步编程的一种解决方案, 具体语法参考 [ECMAScript 6 入门](http://es6.ruanyifeng.com/#docs/generator), 通过 `Generator` 可以将之前回调的写法优化成这样:

```js
function after1Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('1s later')
      resolve()
    }, 1000)
  })
}

function after2Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}

function after3Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}

function after4Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
}

function * cb2Generator () {
  yield after1Sec
  yield after2Sec
  yield after3Sec
  yield after4Sec
}

const g = cb2Generator()
g.next().value()
  .then(() => {
    return g.next().value()
  }).then(() => {
    return g.next().value()
  }).then(() => {
    return g.next().value()
  })
```

上面的示例代码中, 很明显的可以看出使用 `Generator` 需要手动调用以启动执行, 这就显得比较麻烦。

### `Generator` + `Promise` 实现任务执行器

```js
function run (gen) {
  const g = gen()
  let result = g.next()

  ;(function step () {
    if (!result.done) {
      let promise = Promise.resolve(result.value)
      promise.then(value => {
        result = g.next(value)
        step()
      }).catch(err => {
        result = g.throw(err)
        step()
      })
    }
  })()
}

run(function * () {
  yield after1Sec()
  yield after2Sec()
  yield after3Sec()
  yield after4Sec()
})

function after1Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('1s later')
      resolve()
    }, 1000)
  })
}

function after2Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}

function after3Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}

function after4Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
}
```

通过任务执行器 `run`, 不再需要手动调用 `Generator` 的启动器了。

## `async` + `await`

ES8 标准引入了 `async` 函数, 使得异步操作更加方便了。 `async` 函数是 `Generator` 函数的语法糖, 具体语法参考 [ECMAScript 6 入门](http://es6.ruanyifeng.com/#docs/async)。

相较于 `Promise` 和 `Generator`, `async` 函数具有更好的语义并且使用起来也更简单。 通过 `async` 函数可以将上述代码进行优化:

```js
function after1Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('1s later')
      resolve()
    }, 1000)
  })
}

function after2Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('2s later')
      resolve()
    }, 1000)
  })
}

function after3Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('3s later')
      resolve()
    }, 1000)
  })
}

function after4Sec () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('4s later')
      resolve()
    }, 1000)
  })
}

async function exec () {
  await after1Sec()
  await after2Sec()
  await after3Sec()
  await after4Sec()
}

exec()
```

## 参考

- [深入理解 ES6](https://book.douban.com/subject/27072230/)
- [ECMAScript 6 入门](https://book.douban.com/subject/27127030/)
