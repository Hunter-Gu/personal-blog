---
title: 《CSS 揭秘》 读后总结（上） --- 实用技巧
date: 2019-10-19 14:43:37
tags: css
categories: Frontend
---

最近看了 [《CSS 揭秘》](https://book.douban.com/subject/26745943/) 这本书， 这是一本 CSS 的技巧书， 不建议通过本书学习 CSS 基础。 其中有一些技巧是非常实用的， 但是对于另外的内容， 可能会让我们觉得没有它我们也能很好的工作， 但是这些技巧不是套路， 它们都是启发式， 可以让我们更好的理解某个属性它的本质。

## 元素数量

经常会遇到要根据元素数量设置样式的需求， 大致思路是通过 `:nth-child()` 结合兄弟选择器 `~` 达到目的。

### 单个元素

`:only-child` 伪类会匹配没有任何兄弟元素的元素， 功能等同于 `:first-child:last-child` 或者 `nth-child(1):nth-last-child(1)`， 只不过前者权重较低。

### 多个元素

- 1.选中第一个元素， 比如 `li`
- 2.通过 `:first-child:nth-last-child({n})` 选中总数量为 n 时， 第一个元素
- 3.通过兄弟选择器 `~` 选择第一个元素后的元素

以 4 个元素为例：

```css
li:first-child:nth-last-child(4),
li:first-child:nth-last-child(4) ~ li, {
  /* 4 个元素的样式 */
}
```

### 数量范围

利用 `nth-child()` 和 `nth-last-child()` 的**参数可以是表达式**的特性， 就可以达到对不同数量范围的元素， 设置不同的样式的目的：

#### [m, +oo)

以“至少四个元素”时的情况为例：

```css
li:first-child:nth-last-child(4 + n),
li:first-child:nth-last-child(4 + n) ~ li {
  /* 至少 4 个元素时的样式 */
}
```

#### [1, m]

如果是想要选中“开头四个元素”的情况：

```css
li:first-child:nth-last-child(4 - n),
li:first-child:nth-last-child(4 - n) ~ li {
  /* 开始 4 个元素的样式 */
}
```

#### [m, n]

将上述两种方式结合， 就可以达到选中其中某几个元素的效果。

以“选中第四个到第六个元素”为例：

```css
li:first-child:nth-last-child(4 + n):nth-last-child(6 - n),
li:first-child:nth-last-child(4 + n):nth-last-child(6 - n) ~ li {
  /* 选中第四个到第六个元素 */
}
```

## `width`

### `min-content` & `max-content` & ...

通过 `min-content` 实现如下效果非常方便：

![min-content](screenshot_330.png)

关于这些属性的功能， 还请查看张鑫旭的 [《理解 CSS3 max/min-content 及 fit-content 等 width 值》](https://www.zhangxinxu.com/wordpress/2016/05/css3-width-max-contnet-min-content-fit-content/)， 他解释得一定比我更到位。

## 伪元素

伪元素的功能非常多， 可能没办法很好的归纳， 但是下面两种是不常见的应用场景， 你一定会对两种用途感到惊讶。

### 扩大点击区域

伪元素可以响应鼠标事件， 所以利用这一特性， 可以通过伪元素来扩大点击区域：

```css
button::before{
  content: '';
  position: absolute;
  top: -10px; right: -10px; bottom: -10px; left: -10px;
}
```

### 平行四边形 --- 伪元素 + `skew()`

是的， 利用伪元素还可以既简单又好地实现某些多边形， 比如平行四边形。

利用伪元素实现平行四边形只需要一个 `HTML` 元素就可以了， 代码如下：

```html
<div class="parallelogram"></div>
```

```css
.parallelogram {
  position: relative;
  width: 300px;
  height: 100px;
}

.parallelogram::before {
  content: '';
  position: absolute;
  display: block;
  top: 0; right: 0; bottom: 0; left: 0;
  transform: skew(45deg);
  z-index: -1;
}
```

## 自定义复选框 `label` + `:checked`

大多情况下， 原生复选框的样式不能让我们满意， 通过 `label` + `:checked` 可以避免写大量 JavaScript 代码的同时， 又很好的实现对复选框的样式自定义。

先看 `HTML` 代码：

```html
<input type="checkbox" id="awesome" />
<label for="awesome">Awesome!</label>
```

利用 `<label>` 可以为 `<input>` 定义标记的功能， 配合 `:checked` 伪类：

```css
/* 未选中的样式 */
input[type="checkbox"] + label::before {
  content: '\a0'; /* 不换行空格 */
  display: inline-block;
  vertical-align: .2em;
  width: .8em;
  height: .8em;
  margin-right: .2em;
  border-radius: .2em;
  background: silver;
  text-indent: .15em;
  line-height: .65;
}

/* 选中样式 */
input[type="checkbox"]:checked + label::before {
    content: '\2713';
    background: yellowgreen;
}

/* 将原来的复选框隐藏 */
/* 为什么不用 display: none? 因为这会影响 tab 切换 */
input[type="checkbox"] {
    clip-path: circle(0);
}
```
