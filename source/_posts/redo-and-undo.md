---
title: redo-and-undo 的多种实现
date: 2021-09-23 12:14:36
tags: javascript
categories: Frontend
---

最近在做 side project 时，遇到了 redo and undo，也就是所谓的重做和撤销问题，在动手尝试并反思后发现，这个问题有不少的处理方案。

> 注：本文只分析 `Object` 类型，不对分析简单数据类型。

## 副本

先说一种最简单的方式 - 副本。

每次操作都保存一个当前状态的副本，这种方式实现起来非常简单，就不具体描述了，最大的问题是内存问题。

一旦当前的值是一个很大的对象，再将这个对象的多个副本记录下来，内存消耗就很严重，如果要保存很长的操作记录，内存可能就不够用了。

## 本质

仔细想想，redo 和 undo 的核心其实在于 diff，举个例子：

```js
{
  children: []
}
```

执行一个类似 `insert` 的操作：

```diff
{
  children: [
+  	{
+  		name: 'input',
+  		props: {
+  			value: '',
+  			placeholder: 'Please input your name'
+  		}
+  	}
  ]
}
```

执行一个类似 `update` 的操作：

```diff
{
  children: [
  	{
  		name: 'input',
  		props: {
+  			value: 'Nail',
  			placeholder: 'Please input your name'
  		}
  	}
  ]
}
```

redo 和 undo 操作其实就是在这几种值之间来回穿梭，那么只需要将每次操作的 diff 保存下来，就可以实现 redo 和 undo 操作。

那么 diff 是什么，或者说该如何保存每次操作的 diff 信息？

**diff 的本质是 prop path 以及对应的 value**。仍旧使用上面的例子：

```js
{
  children: []
}
```

执行一个类似 `insert` 的操作，其实就是对 `children.0` 执行 insert 操作：

```diff
{
  children: [
+  	{
+  		name: 'input',
+  		props: {
+  			value: '',
+  			placeholder: 'Please input your name'
+  		}
+  	}
  ]
}
```

执行一个类似 `update` 的操作，其实就是把 `children.0.props.value` 更新为 `'Nail'`：

```diff
{
  children: [
  	{
  		name: 'input',
  		props: {
+  			value: 'Nail',
  			placeholder: 'Please input your name'
  		}
  	}
  ]
}
```

所以现在问题就变成了获取 diff。

## 遍历

通过遍历（DFS/BFS）可以获取到 diff，过程倒也不太繁琐，但是有一些限制：

- 对于大对象而言，性能是个问题
- 对于值为数组的情况，很难获取 diff
  - 移动
  - 添加
  - 删除

为什么值为数组的情况很难获取 diff？

以 VNode tree 为例：

```js
{
	children: [
		{
			name: 'input',
			attributes: {
				class: 'className-1',
				style: 'color: red',
			},
			props: {
				value: '',
				placeholder: 'Please input your name',
			},
		},
		{
			name: 'input',
			props: {
				value: 'Nail',
				placeholder: 'Please input your name',
			},
		}
	]
}
```

进行一个移动（换位）操作：

```js
{
	children: [
		{
			name: 'input',
			props: {
				value: 'Nail',
				placeholder: 'Please input your name',
			},
		},
		{
			name: 'input',
			attributes: {
				class: 'className-1',
				style: 'color: red',
			},
			props: {
				value: '',
				placeholder: 'Please input your name',
			},
		},
	]
}
```

- 扩展到深层的场景，获取数组 diff 的时间复杂度将是接近 O(N ^ n), n 为层数，这肯定是不可接受的
- 所以为了简化，就只能比对数组中相同位置的属性值，但此时就会出现多个 prop path 变化的情况

简单实现可见 [bfs 实现](https://github.com/Hunter-Gu/redo-and-undo-ways/blob/main/src/traversal/bfs.ts) & [dfs 实现](https://github.com/Hunter-Gu/redo-and-undo-ways/blob/main/src/traversal/dfs.ts)。

## 命令模式

命令模式是处理 redo 和 undo 问题的标准做法，把每一种操作抽象为一个 `Command`，这使得很容易扩展：

```ts
abstract class BaseCommand {
	abstract redo(): void;

	abstract undo(): void;
}

class AddCommand extends BaseCommand {
	redo() {
		// ...
	}

	undo() {
		// ...
	}
}

class RemoveCommand extends BaseCommand {
	redo() {
		// ...
	}

	undo() {
		// ...
	}
}
```

## 属性拦截

既然最终目的是想要获取 prop path 以及对应的 value，那么当然可以有更直接的方式。

### 工具函数

大家可能都用过 lodash 的 [`get()`](https://lodash.com/docs/4.17.15#get) 和 [`set()`](https://lodash.com/docs/4.17.15#set) 方法，提供一套类似的工具函数，来代替直接操作属性，并进行拦截。

简单实现可见 [access-interceptor](https://github.com/Hunter-Gu/redo-and-undo-ways/blob/main/src/access-interceptor/access-interceptor.ts)。

### proxy

当有拦截属性操作的需求是时，很容易想到代理，通过代理，很容易对每次操作进行拦截。

简单实现可见 [proxy](https://github.com/Hunter-Gu/redo-and-undo-ways/blob/main/src/proxy/proxy.ts)。
