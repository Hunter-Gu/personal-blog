---
title: Vue 源码学习 - 组件挂载
date: 2020-03-21 14:51:11
categories: Frontend
tags: vue
---

在模板编译后，本应该将虚拟 DOM 的部分，但是对于这部分，有更好的[讲解文章](http://hcysun.me/vue-design/zh/essence-of-comp.html)，感兴趣的话可以去看看。

由于我对 `Vue` 是如何挂载组件的更感兴趣，所以我去看了一下这部分的代码。

这篇文章会从 `createElement()` 函数开始讲起，这个函数的作用是创建 `VNode` 节点。

对于组件的挂载，会经历如下过程：
- 判断是否是组件
  - 判断注册了该组件
- 创建组件
  - 创建组件的构造函数
  - 设置 `props`
  - 返回组件的占位节点
- 挂载组件
  - 创建组件实例
  - 挂载 DOM 节点

## 判断是否是组件

在 `createElement()` 函数中，怎么才能知道一个标签表示的是组件呢？

很简单，根据这个标签是否是内置标签即可：

```js
function createElement(vm, tag, data, children) {
  let vnode
  let Ctor
  if (typeof tag === 'string') {
    if (config.isReversedTag(tag)) {
      // 是内置标签，如 div, p 等
      vnode = new VNode(tag, data, children)
    } else if (Ctor = vm.options.components[tag]) {
      // 注册了该组件
      vnode = createComponent(Ctor, data, children)
    }
  } else {
    // 标签不是 string 类型的话，就认为是组件
    vnode = createComponent(tag, data, children)
  }
}
```

## 创建组件

当我们声明一个 `Vue` 的组件时，是通过下面的方式声明的：
```js
const Comp = {
  name: 'Comp',
  data() {
    return {

    }
  },
  methods: {
    // ...
  }
}
```

而声明根组件实例时，是通过另一种方式：
```js
const root = new Vue({
  el: '#app',
  data() {
    return {

    }
  },
  methods: {
    // ...
  }
})
```

两种方式对比，很明显第二种方式更利于组件的复用：
- 第一种方式是对象风格的，这种风格可以理解为单例
- 第二种方式是类式风格的，每个实例之间是互不影响的

`Vue` 在内部就做了一层转换，将组件的声明对象转换为一个名为 `VueComponent` 的构造函数，而这个工作就由 `Vue.extend()` 完成。


### `Vue.extend()`

`Vue.extend()` 其实很简单，简而言之就是：
- 把 `Vue` 上的属性和方法拿过来
- 把执行 `new Vue()` 的执行过程也拿过来

```js
Vue.extend = function(extendOptions) {
  const Super = Vue
  // 和 Vue 的函数声明一模一样
  const Sub = function VueComponent(options) {
    this._init(options)
  }

  // 复制原型方法
  Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub

  Sub.super = Super

  // 复制静态方法
  const { extend, mixin, use, components, directives, filters } = Super
  Sub.extend = extend
  Sub.mixin = mixin
  Sub.use = use
  Sub.components = components
  Sub.directives = directives
  Sub.directives = directives
  Sub.filters = filters

  Sub.options = extendOptions
  // 使得可以使用递归组件
  const name = extendOptions.name || Super.options.name
  if (name) {
    Sub.options.components[name] = Sub
  }

  return Sub
}
```

实际上 `Vue.extend()` 会对最终的结果缓存，因为对于一个组件的声明对象而言，每次的转换结果应该都是一样的：
```js
Vue.cid = 0
let cid = 1
Vue.extend = function(extendOptions) {
  const SuperId = Super.cid
  let cachedCtors
  if (!extendOptions._Ctor) {
    extendOptions._Ctor = {}
  }
  cachedCtors = extendOptions._Ctor

  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }

  // ... 保持不变
  Sub.cid = cid++
  cachedCtors[SuperId] = Sub
}
```

### 设置 `props`

设置组件的 `props` 是个非常简单的过程，可以总结为**从 `VNodeData` 来，到 `props` 去**。

```js
function extractPropsFromVNodeData(vnodeData, VueComponent) {
  const propsOptions = Ctor.options.props

  if (!props) return

  const { attrs, props } = vnodeData

  const res = {}
  if (attrs || props) {
    for (const key in propsOptions) {
      // 实际上 key 会被转换为 hyphen 风格
      if (props.hasOwnProperty(key)) {
        res[key] = props[key]
      } else if (attrs[key]) {
        res[key] = attrs[key]
        delete attrs[key]
      }
    }
  }
}
```

这段代码同时回答了另一个问题，组件不会区分一个属性是 `attribute` 还是 `prop`，对于组件而言，**如果一个属性没有被声明为 `prop` 那么就认为是 `attribute`。**
![非 Prop 属性](./screenshot_331.png)

### 返回组件的占位节点

在完成上面的步骤后，会创建一个组件节点，该节点是用来占位的，。。。

```js
const listeners = data.on
data.on = data.nativeOn

const vnode = new VNode(
  `vue-component-${Ctor.cid}-${Ctor.options.name}`, data, children, /* componentOptions */ { Ctor, propsData, listeners, children }
)
```

## 挂载组件

在这一步之前，不管是平台内置的节点（如 `div`, `p` 等）还是组件节点，都只是创建了 VNode 节点，还没有创建对应的 DOM 节点。

实际上，在上一步中，会为创建的组件的占位节点添加一些特殊的方法。

### 组件节点的生命周期

这些特殊的方法用于描述组件节点的生命周期，有如下生命周期：

- init
- insert
- prepatch
- destroy

在挂载组件时，实际上就是通过这些方法，对组件的占位节点进行操作，从而达到将组件节点挂载到 DOM 中的目的。

### 创建组件实例 - init

创建组件实例很简单，和 `new Vue()` 差不多。

在上一个步骤中，我们已经创建了组件的占位节点，而该占位节点的 `componentOptions` 就保存着构造函数等信息：

```js
const child = vnode.componentInstance = new vnode.componentOptions.Ctor(options)

child.$mount()
```

而这一步其实就是组件节点生命周期中的 init 的作用。

### 挂载组件

在创建后确实执行了 `mount()` 但是由于没有目标节点，所以并不会真正的挂载。

接下来会执行平台下的 `insert()` 方法（web 平台下是 `appendChild()` 或 `insertBefore()`）将组件的节点插入到父节点下。

最终，只要将根组件实例挂载到指定的节点下，就实现了组件的挂载，同时页面也就可见了。

### `mount` 生命周期

组件挂载后，会触发 `mount` 钩子。实际上 `Vue` 会维护创建的组件实例，当根组件挂载后，依赖触发 `mount`。

TODO 异步组件
