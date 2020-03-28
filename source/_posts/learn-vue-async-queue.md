---
title: Vue 源码学习 - 异步更新队列
date: 2020-03-21 22:53:17
categories: Frontend
tags: vue
---

[`Vue` 的官方文档](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97)中有对异步更新队列进行介绍，而 `Vue.prototype.$nextTick()/Vue.nextTick()` 就是对外包暴露的接口。

简单来说，异步更新队列就是“将一段时间内的修改，统一延迟到某个时间点执行”。

这么做的好处是可以避免不必要的渲染。我们每次修改数据，会导致组件的重新渲染，对于一个组件而言，一段时间内不大可能只修改一个数据，这就会引起多次重新渲染，这显然是不必要的。而将修改缓存，在一段时间后只执行一次重新渲染听起来就是个不错的注意。

## 异步任务队列 - `Vue.prototype.$nextTick()`

我把 `Vue.prototype.$nextTick()` 称为异步任务队列，因为它并不具备更新视图的能力。

```js
const queue = []
let pending = false

function nextTick(cb) {
  queue.push(cb)

  if (!pending) {
    pending = true
    runTimerFunc()
  }
}

function flushQueue() {
  const copies = queue.slice(0)
  queue.length = 0

  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
  pending = false
}

// 异步任务执行器
let microTask
let macroTask
let useMicroTask = true
if (typeof Promise !== undefined) {
  const p = Promise.resolve()
  microTask = () => p.then(flushQueue)
} else {
  task = () => setTimeout(flushQueue, 0)
  useMicroTask = false
}

function runTimerFunc() {
  if (useMicroTask) {
    microTask()
  } else {
    task()
  }
}
```

## 更新视图

在[变化监测](/personal-blog/2020/03/21/learn-vue-observer)这篇博客中，我们反复提到**响应式数据变化后，会通知依赖（视图）更新**，但是却从未提到如何更新视图。 TODO

在[组件挂载]()中，我们知道组件是通过如下方式实现挂载、渲染的：

```js
new Watcher(vm, updateComponent)
```

所以更新视图只需要在数据修改后触发回调执行就可以了：

```js
class Watcher {
  update() {
    queueWatcher(this)
  }
}

function queueWatcher(watcher) {
  nextTick(watcher.run)
}
```

### 调度器

在上面的代码目前可以运行，但是组件的生命周期是混乱的。子组件修改某个数据后，父组件再修改某个数据，会导致子组件的 `update` 钩子先触发，这是不符合感知的。

我们希望，**对于同一种生命周期函数，总是按照从父组件到子组件的顺序触发。**所以就需要进行调度来实现顺序的编排，那么该怎么做？ - 给 `Watcher` 添加 `id`！

为什么给 `Watcher` 添加 `id` 可以是实现顺序的编排？

因为创建组件是按照从父组件到子组件的顺序创建的，那么对应的组件的 `Watcher` 就也是按照这个顺序，话句话说父组件的 `id` 肯定是小于子组件的 `id` 的：

```js
id = 0
class Watcher {
  constructor() {
    this.id = ++id
  }
}

const queue = []

function flushSchedulerQueue() {
  queue.sort((a, b) => a.id - b.id)

  for (let i = 0; i < queue.length; i++) {
    const watcher = queue[i]

    watcher.run()
  }

  queue.length = 0
}

function queueWatcher(watcher) {

  queue.push(watcher)

  nextTick(flushSchedulerQueue)
}
```
