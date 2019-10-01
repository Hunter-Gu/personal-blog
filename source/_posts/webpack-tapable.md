---
title: tapable
date: 2019-03-13 00:14:31
categories: Frontend
tags: webpack
---

为了更深入的了解 webpack, 最近看了它的的核心模块 [tapable](https://github.com/webpack/tapable) 的源码。

tapable 的源码并不复杂, 本质上是发布订阅模式, 然后添加了一些扩展功能, 如 Interceptor, stage, BailHook, WaterfallHook, LoopHook。

发布订阅模式的简单实现如下:

```js
class Observer {
  constructor() {
    this.listeners = {};
  }

  on(name, handler) {
    const listeners = (this.listeners[name] = this.listeners[name] || []);
    listeners.push(handler);
  }

  trigger(name) {
    if (Array.isArray(this.listeners[name])) {
      this.listeners[name].forEach(handler => {
        handler();
      });
    }
  }
}
```

在上述 Observer 的基础上, 进行一些扩展就是 tapable 了。

## Hook

Hook 类是 Tapable 中核心的部分, 所有的 Hook 都继承自该类, 核心的方法 `tap()`, `tapAsync()`, `tapPromise()`, 以及对应的 `call()`, `callAsync()`, `promise()` 都是定义在该基类上的。 此外, 注册拦截器的 `intercept()` 方法也定义于该类之上。

和 Observer 不同的是, 在 tapable 中, 一个 Hook 实例就表示一种类型的事件, Hook 实例通过 `tap*()` 方法注册事件, 然后通过 `call*()`(或 `promise()`) 方法触发。

所以将上述 Observer 修改为 Hook 后大致如下:

```js
class Hook {
  constructor() {
    this.taps = [];
    this.interceptors = [];
  }

  tap(name, fn) {
    this.taps.push({
      name,
      fn
    });
  }

  call() {
    this.taps.forEach(tap => {
      tap.fn();
    });
  }

  intercept(interceptor) {
    this.interceptors.push(interceptor);
  }
}
```

### tap

既然提到了 `tap*()` 方法, 就不得不提一下 `tap*()` 方法的作用:

- 1.生成 tap 参数, tap.type 会决定 codeFactory 生成的代码;
- 2.调用 interceptor.register() 来修改 tap;
- 3.存储该 tap。

其中 tap 参数是一个对象, 该对象在调用 `tap*()` 方法后生成, 该对象具有如下属性:

- type: 表示通过 `tap*()` 方法注册的函数的类型, 通过 `tap()` 方法注册的值为 sync, 通过 `tapAsync()` 方法注册的值为 async, 通过 `tapPromise()` 方法注册的值为 promise;
- name: `tap*()` 方法的第一个参数, 用于标识该函数;
- fn: 注册的函数;
- stage: `Number` 类型, 表示注册的函数的优先级, 值越小优先级越高, 越先执行;
- before: 官方文档并没有说明该字段, 和 stage 的功能类似, 用于将该函数移动到指定的 name 之前执行。

### Interceptor

Interceptor 是拦截器, 它接受一个对象作为参数, 该对象可以含有如下四个方法: `tap()`, `call()`, `loop()` 以及 `register()`, 这四个拦截器方法会在 hook 实例执行相应的操作时触发:

- `register()`: 每次调用 hook 实例的 `tap()` 方法注册回调函数时, 都会调用该方法, 并且接受 tap 作为参数, 还可以对 tap 进行修改;
- `loop()`: 每次调用被注册的回调函数前, 都会先调用 `loop()` 方法;
- `tap()`: 调用注册的每一个回调函数时, 都会触发;
- `call()`: 调用 hook 实例的 `call()` 方法时触发。

所以代码被修改为:

```js
class Hook {
  constructor() {
    this.taps = [];
    this.interceptors = [];
  }

  tap(name, fn) {
    const options = this._runRegisterInterceptors({
      name,
      fn
    });
    this.taps.push(options);
  }

  call() {
    this.taps.forEach(tap => {
      tap.fn();
    });
  }

  intercept(interceptor) {
    this.interceptors.push(Object.assign({}, interceptor));

    if (interceptor.register) {
      for (let i = 0; i < this.taps.length; i++) {
        this.taps[i] = interceptor.register(this.taps[i]);
      }
    }
  }

  _runRegisterInterceptors() {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        const newOptions = interceptor.register(options);
        if (newOptions !== undefined) {
          options = newOptions;
        }
      }
    }
  }
}
```

## Hook 的类型

Hook 主要分为两类: Sync 和 Async, 下面分别介绍这两类。

### SyncHook

顾名思义, 同步钩子, 表示注册的回调函数都是**同步**函数, 通过 `tap()` 方法注册, 并且它们按照先后顺序执行, 先注册的先执行。 大致代码如下:

```js
this.taps.forEach(tap => {
  tap.fn();
});
```

### AsyncHook

异步钩子, 又分为 Series 和 Parallel, 即注册的回调函数是串行和并行执行的。 我们只以回调方式为例, 因为改写为 Promise 方式也比较简单。

#### Series

通过将下一个回调函数作为前一个回调函数的参数传递, 从而实现串行执行。 大致代码如下:

```js
const next = i => {
  if (i >= taps.length) return;

  taps[i].fn(...arguments, err => {
    if (err) callback(err);
    else next(i + 1);
  });
};

next(0);
```

#### Parallel

相比而言, 并行方式就简单的多:

```js
taps.forEach(tap => {
  tap.fn();
});
```

## 回调的执行方式

tapable 中有多种 Hook 类, 这些 Hook 类主要和注册的回调函数的返回值有关, 大致有四种类型。 以简单的 Sync 方式进行说明会更好理解。

### Hook

最普通的 Hook 类型, 和平时使用的发布订阅模式并无不同。

### BailHook

当某个注册的函数返回值不是 `undefined` 时, 就会停止执行之后的函数。

```js
const results = new Array(taps.length);

taps.forEach((tap, i) => {
  results[i] = tap.fn(...arguments);

  if (results[i] !== undefined) {
    callback();
    return;
  }
});
```

### WaterfallHook

前一个注册的函数的返回值, 会作为后一个函数的参数传递。

```js
let preRes = '';
taps.forEach((tap, i) => {
  if (i === 0) preRes = tap.fn(...arguments);
  else tap.fn(preRes);
});
```

### LoopHook

当注册的函数的返回值不是 `undefined` 时, 就会循环调用这个函数。

```js
let loop = false;

const next = i => {
  if (i >= taps.length) return;
  do {
    loop = false;
    result = taps[i].fn(...arguments);
    if (result !== undefined) loop = true;
    else {
      next(i + 1);
    }
  } while (loop);
};

next(0);
```

## MultiHook

MultiHook 相当于是 hook 实例的代理, 并且支持 hook-like(和 thenable 概念类似)参数, 当调用 MultiHook 实例的方法时, 就会去调用 hook-like 对象的同名方法。 实现方式比较简单:

```js
class MultiHook {
  constructor(hooks) {
    this.hooks = hooks;
  }

  tap(options, fn) {
    for (const hook of this.hooks) {
      hook.tap(options, fn);
    }
  }

  // 其他方法也是如此
  // ...
}
```

另外还有用于存储 hook 实例的 HookMap 类, 不太常用而且非常简单, 就不进行过多的说明了。
