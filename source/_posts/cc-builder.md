---
title: Cocos Creator 命令行构建
date: 2019-06-01 13:05:55
tags: cocos creator
categories: Frontend
---

> Cocos Creator 是一个完整的游戏开发解决方案, 包括了 cocos2d-x 引擎的 JavaScript 实现, 以及能让你更快速开发游戏所需要的各种图形界面工具。 Cocos Creator 完全为引擎定制打造, 包含从设计、开发、预览、调试到发布的整个工作流所需的全功能一体化编辑器。 Cocos Creator 目前支持发布游戏到 Web、iOS、Android、各类"小游戏"、PC 客户端等平台, 真正实现一次开发, 全平台运行。

以上内容选自[官方文档](https://docs.cocos.com/creator/manual/zh/getting-started/introduction.html)。 总结出来就是以下几点:

- Cocos Creator 是 cocos2d-js 引擎的图形化工具, 可以更方便、 更高效的开发游戏
- Cocos Creator 制作的游戏可以发布到几乎任何平台

通过 Cocos Creator 开发游戏确实非常高效, 各种工具一应俱全, 游戏的性能也是非常出色。 但是游戏的构建存在一些不便, 尽管官方提供了[命令行发布](https://docs.cocos.com/creator/manual/zh/publish/publish-in-command-line.html)的功能, 但总是觉得缺了什么。

## 场景

试想以下场景, 当你通过 Cocos Creator 开发了几十甚至上百个游戏, 有些游戏使用了相同的 [build-template](https://docs.cocos.com/creator/manual/zh/publish/custom-project-build-template.html#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%8F%91%E5%B8%83%E6%A8%A1%E7%89%88) 甚至连游戏加载的界面都需要相同。 这时候官方的命令行发布就不够用了, 虽然你可以通过复制(不管是手动还是通过 shell 批量复制)来达到这一目的, 但就是感觉有那么一点不灵活; 再加上如果这些游戏放在同一个服务下, 静态资源服务的路径查找也是问题, 所以需要定制一套构建工具来完成对这些功能的扩展。

上述场景提及的问题, 其实是前端开发中比较常见的问题, 只是 Cocos Creator 本身并不是特别前端化的工具, 它首先是游戏开发工具, 只不过是现在跑在了浏览器环境而已。 但是既然遇到了问题, 就需要解决问题, 我们完全可以把前端的工程化概念引入, 使它更"现代化"一点。

## 配置化

想要灵活性, 就不可避免的会提升一点复杂度, 把各种选项配置化就可以达到这个目的。 那么现在问题就变成了需要提供哪些配置项呢? 针对上述场景, 容易想到的有以下几点:

- 编译哪(几)个游戏
- 它们使用的模板
- 编译到哪个平台
- 编译后输出到哪个路径
- 静态资源服务路径

在明确这些配置项之后, 接下来的工作不过是一些文件操作, 最后通过官方的命令行发布工具就可以完成最终的构建工作。

## 编译到 Vue

在完成上述功能后, 我不禁想能不能将 Cocos Creator 和前端开发的其他库如 Vue 结合起来。 因为想要通过前端库(如 [pixijs](https://www.pixijs.com/) 等)实现比较炫酷的游戏效果成本还是比较高, 而单纯通过 Cocos Creator 来实现又无法保证较好的代码复用性。

仔细观察一下 Cocos Creator 发布后的 .html 文件会发现, 引用了两个 .js 文件(main.js 和 setting.js, cocos 的运行时自然不必多说), 试着直接复制这两个 .js 文件的内容到测试用的 .vue 文件中试试, 发现可以运行, 既然如此我们就可以把 Cocos Creator 编译到 Vue 的 SFC 文件(单文件组件)。

### AST

现在要做的很简单, 无非就是把 main.js 和 setting.js 的内容直接读取到预先定义好的 .vue 模板中。 我的做法是定义一个 `__cc__require__()` 方法, 参数是想要引用的文件, 该方法会将文件的内容读取到 .vue 模板中, 最终生成一个新的 .vue 文件。

通过 babylon 及其相关工具库(babel-generator, babel-traverse)就可以很简单的到达这一目的, 将 `__cc__require__(filename)` 替换为最终的文件内容并生成文件即可。

## Vue 和 Cocos Creator 混合开发

既然可以把 Cocos Creator 的构建结果编译到 Vue, 那就少不了将两者混合起来进行开发。 由于 Cocos Creator 已经将开发时的编译直接放到了应用中, 我们没办法获取具体细节, 而且这么做也太麻烦, 我就采用了其他方式。

- 同时启动 Vue 的编译, 以及 Cocos Creator 的开发, 将 Vue 的编译结果输出到 Cocos Creator 的 scripts 路径下, 将 Vue 的编译结果作为 Cocos Creator 的脚本。 当然在最终执行 Cocos Creator 的构建时, Vue 的编译结果要先删除。
- 编写一个 `history2Hash()` 方法将 VueRouter 的 history 模式替换为 hash 模式, 否则 Cocos Creator 的服务无法伺服当前的 URL。
- 测试环境或者 pre 环境的后端服务开启 CORS 避免跨域问题, 保证可以正常调试接口。
- 如果你的前端脚手架是多页面的, 那就在编译时指定将哪个 entry 文件编译到 Cocos Creator 的哪个游戏下(如果你有多个 Cocos Creator 游戏)。

> 注: 最终构建 Cocos Creator 时, 别忘了把 Vue 编译的文件先删除。

## cc-builder

最后, Cocos Creator 的命令行构建工具已经实现并发布到 npm, 通过 `npm install cc-builder -g` 即可使用。 具体代码和文档可见 [github](https://github.com/Hunter-Gu/cc-builder)。
