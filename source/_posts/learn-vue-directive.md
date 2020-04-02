---
title: Vue 源码学习 - 指令的奥秘
date: 2020-03-26 19:35:40
categories: Frontend
tags: vue
---

指令的本质/奥秘是什么？

- `v-if`是怎么实现的？
- `v-for`是怎么实现的？
- `v-model`是怎么实现的?
- `v-on`是怎么实现的?
- `v-bind`是怎么实现的?

指令的处理会贯穿 `Vue` 内部的各个核心技术点：

```mermaid
stateDiagram
  normalizeDirectives --> create --> update --> destroy
```

## 格式化

由于指令支持函数和对象类型，所以在初始化时需要格式化为对象类型：

```js
function normalizeDirectives(directives) {
  if (directives) {
    for (const key in directives) {
      const def = directives[key]
      if (typeof def === 'function') {
        // 转换为对象形式
        directives[key] = {
          bind: def,
          update: def
        }
      }
    }
  }
}
```

可以看到，`bind` 和 `update` 两个钩子是一定会有的，之后会介绍它们在何时触发。
