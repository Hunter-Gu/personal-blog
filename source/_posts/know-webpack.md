---
title: 认识 webpack
date: 2019-02-20 00:59:13
categories: Frontend
tags: webpack
---

## TL;DR

- webpack 根据**依赖关系**进行构建, 打包输出。 通过 `import` 或 `require()` 的方式引入依赖模块。
- 通过 `entry, output, loader` 配置项就可以搭建一个基于 webpack 的最小系统。
- 从需求出发, 扩展配置。

---

我们从三个方面来认识 webpack。

## webpack 是什么

按照官方文档的说法, webpack 是一个 module bundler, 它会从 entry 开始根据**依赖**创建一个依赖图, 然后映射到每个模块, 最终输出一个或多个 bundle。 即把一类文件根据**依赖关系**打包输出为一个或多个文件。

一般而言, 它只会输出一个文件。 如果添加一些 code splitting 相关的配置, 或使用了 dynamic import, 就会输出额外的 chunk 文件。

## 为什么要使用 webpack

目前而言, webpack 解决的最主要问题是: 基于**依赖关系**的模块化问题。换句话说如果各个模块之间没有依赖关系, 那就不需要使用它。

webpack 会将所有文件都认为是模块, 并通过 loader 处理它们, 而在这些模块处理中, 最主要的就是 JavaScript 的模块化问题。 我们知道目前浏览器并没有很好的兼容各种模块化方式, 而在 webpack 中既支持 Node.js 中的 `CommonJS require()`, 又支持 `ES6 import`, 这是怎么办到的呢?

首先我们要了解一下 babel, babel 是一个 JavaScript 的 compiler, 它可以将 ES Next 的代码编译为 ES5 的代码, 所以他会将 `import` 进行转换:

```js
import lodash from 'lodash';

// ...
```

上述代码会被编译为:

```js
var Vue = require('vue');

// ...
```

而 webpack 会将 `require()` 转换为其内部的 `__webpack_require__` 方法以达到良好兼容性的“模块化”方式。

## webpack 该怎么使用

前面强调, webpack 根据**依赖关系**进行打包构建, 所以所有被依赖的模块, 都应该在 entry 或依赖模块中将其进行引入。 也就是说, 应该通过 `import` 或 `require()` 的方式引入 JavaScript, CSS, 图片等依赖, 这样它才会被 webpack 处理。

### webpack 中的基本概念

想要自己手动搭建一个基于 webpack 的脚手架时, 需要先了解一些概念:

- entry: 入口文件, 是 webpack 构建的起点, 可以是 String|Object|Array 类型。 当想要构建多个页面时, 就需要指定为 Object 类型。
- output: 和输出的文件相关, 可以指定输出文件的路径, 名称, 模块化方式等。

- vendor: entry 文件运行时的依赖, 一般是第三方类库。
- chunk: 各个模块被打包为 chunk, 它不是最终的 bundle 文件, 它只是一个中间状态。 通过某些配置可能生成多个 chunk。
- bundle: 最终打包生成的文件, 一般来说和 chunk 是一对一的关系。

- loader: 用于处理各种模块。
- plugin: 用于处理 loader 无法实现的部分。

- hmr: 当源码有变化时, 只会编译变化的部分, 提高效率。

### 最小系统

了解这些概念后, 就可以开始配置 webpack 了:

- entry
- output
- loader

通过上面的几个配置项, 就可以搭建一个基于 webpack 的最小系统了。 那么为什么我们接触到的其他脚手架中, 配置很多呢? 从需求出发! 当你需要什么功能时, 再考虑对它添加配置。

- 比如你写 TypeScript, 那你就需要处理 TypeScript 的 loader, 就去搜关键字 webpack typescript loader 就可以了。
- 比如你需要生成新的 CSS 文件, 你就搜 webpack css extract text, 然后看文档进行使用。

一切从需求出发, 利用搜索引擎就可以完成扩展。
