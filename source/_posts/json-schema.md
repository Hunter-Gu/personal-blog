---
title: 实现一个 Vue json-form
date: 2019-04-15 21:06:53
tags: vue
categories: Frontend
---

在开发管理系统时, 我们几乎一直在编写 `input`, `upload`, `select` 等表单组件, 虽然有 `ElementUI` 等组件库提供了方便, 但是仍旧需要编写模板, 然后就需要测试, 这是一个死循环。

但是这些表单组件实际上使用的逻辑和方法都很相似, 重复的编写和测试让人厌烦, 于是我就想能否将表单的结构通过 `json` 进行表示, 然后根据 `json` 结构渲染出组件树, 并且可以结合 `ElementUI` 这样看起来可以省不少事。

恰好之前看到一个叫作 [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form) 的组件, 是由 Mozilla 开源的 React 组件。 这个组件使用起来略微复杂, 所以我就大致看了一下它的结构, 借鉴了一些地方, 然后就开始设计 json-form 组件了。

## 分层

一般而言, 一个组件会含有 `props` 和向外 emit 的 `events`。 对于表单组件而言, `props` 和 `events` 的功能比较单一:

- `props`: 对于表单组件而言, `props` 一般用于控制 UI 界面;
- `events`: 对于表单组件而言, `events` 一般用于表单的验证以及获取当前的值。

因为 Vue 中提供了 `v-model` 这样的语法糖, 所以 `event` 的功能可以弱化, 最终将它抽象为一个 `value` 层即可。

最终通过两层结构 `props` 和 `value` 就可以大致描述一个表单组件; 加上用于描述组件树结构的 `json`, 所以 json-form 组件通过三层结构就可以描述一个结构化的表单:

- json-schema: 描述组件树的结构, 声明使用的组件;
- ui-schema: 设置每个组件的 `props`;
- value(v-model): 每个组件的 `value`。

也就是说 json-schema 组件的 `props` 就是上面三项, 以及表单数据变化时向上 emit 的 `input` 事件。

## 使用 ElementUI

通过[分层](#分层)步骤, 组件的大致设计其实已经完成了, 接下来本应该是开发表单组件以供在 json-schema 中使用。 但是社区已经有 ElementUI 这样优秀的组件库了, 我们不必自己去造这样的轮子。 利用 `Vue` 中的[动态组件](https://cn.vuejs.org/v2/guide/components.html#%E5%8A%A8%E6%80%81%E7%BB%84%E4%BB%B6)就可以实现这一功能, 代价就是需要将 ElementUI 中的表单组件都声明为全局组件, 还好这么做问题并不大而且也比较方便。

在 json-schema 中直接声明(ElementUI 中表单组件的)组件名就表示使用该组件, 比如声明 ElInput 最终就会在界面中展示一个输入框。

这么做的另一个好处是可以使用全局声明的自定义组件, 所以扩展性就比较好。

## `Validator`

表单组件总是需要 `validator` 的, 所以我们需要提供这样的功能。 将 `validator` 定义在 json-schema 中而不是 ui-schmea 中, 因为如果定义在 ui-schema 中, 就需要依赖于组件自身是否提供了 `validator` 这样的 `prop`, 在每次添加自定义组件时就很不方便。

通过在 json-form 组件内部拦截每个组件的 `input` 事件并调用 `validator` 就可以实现这样的功能。 并且还可以支持自定义 `errorMessage`。

## Nested

有时候你真的需要多层嵌套的表单结构, 可能是在区分各个模块的场景下, 要实现这样的功能也很简单, 利用 `Vue` 中的[递归组件](https://cn.vuejs.org/v2/guide/components-edge-cases.html#%E9%80%92%E5%BD%92%E7%BB%84%E4%BB%B6)就可以实现这样的功能。

## Custom Component

前面提过 json-schema 的设计使得使用自定义组件成为可能, 但是自定义组件也需要满足一些条件才可以很方便的使用:

- 自定义组件必须提供 `value` props, 以表示组件的值;
- 必须 emit `input` 事件, 因为最终的值会通过 `value` + `input` 一层层向上派发, 并且在对值进行验证时, 也需要用到这一事件;
- 通过 emit `blur` 事件, 触发对值的 `required` 进行验证。

具体的[代码实现](https://github.com/Hunter-Gu/json-form)详见 github 仓库。
