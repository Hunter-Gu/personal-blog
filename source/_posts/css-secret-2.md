---
title: 《CSS 揭秘》 读后总结（下） --- 属性功能的多样性
date: 2019-10-19 22:34:17
tags: css
categories: Frontend
---

## `linear-gradient()`

`linear-gradient()` 函数用于创建一个图片， 该图片由两种或多种颜色线性渐变形成。

但是很难想象， 可以通过该函数可以实现多种条纹背景， 甚至[饼图](#饼图-animation-linear-gradient-伪元素)、 折角等效果。

### 条纹背景

通过 `linear-gradient()` 函数实现这样的条纹效果非常简单：

![普通条纹](./screenshot_296.png)

```css
/* 省略了部分 CSS 代码 */
div {
  background-image: linear-gradient(#fb3 30%, #58a 0);
  background-size: 100% 60px;
}
```

但是， 如果要实现这样的效果， 会不会觉得稍有难度？

![棋盘背景](./screenshot_298.png)

```css
div {
  background: #655;
  /* 用两个直接三角形 */
  background-image:
    linear-gradient(45deg, red 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, red 0),
    linear-gradient(45deg, red 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, red 0);
  background-position:
    0 0,
    15px 15px,
    15px 15px,
    30px 30px;
  background-size: 30px 30px;
}
```

## 动画

### 回弹动画

如图所示， 在实现一个动画时， 回弹效果可以让动画更真实：

![回弹效果](./screenshot_332.png)

这个效果的关键在于， 回弹时的曲线函数， 与正向播放时的相反：

```css
@keyframes bounce {
  60%, 80%, to {
    transform: translateY(350px);
    /* 正向时的曲线函数 */
    animation-timing-function: cubic-bezier(.25, .1, .25, 1);
  }
  70% {
    transform: translateY(250px);
  }
  90% {
    transform: tranlateY(300px);
  }
}

.ball {
  /* 回弹时的曲线函数 */
  animation: bounce 3s cubic-bezier(.1, .25, 1, .25);
}
```

### 饼图 `animation` + `linear-gradient()` + 伪元素

通过 `animation` 结合 `linear-gradient()` 可以实现饼图：

![饼图](./screenshot_347.png)

实现起来稍微有点复杂， 所以分几步完成：

- 1.先实现一个圆：

```css
div {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: yellowgreen;
  overflow: hidden;
}
```

- 2.利用 `linear-gradient()` 实现右边一半为另一种颜色：

```css
div {
  background-image: linear-gradient(to right, transparent 50%, skyblue 0);
}
```

先看看当前的效果：

![两个半圆](./screenshot_315.png)

- 3.实现 0 - 50% 的加载？ 需要利用 transform 和伪元素：

```css
div {
  position: relative;
  width: 200px; height: 200px;
  border-radius: 50%;
  background-color: yellowgreen;
  background-image: linear-gradient(to right, transparent 50%, skyblue 0);
}

div::before {
  position: absolute;
  content: '';
  display: block;
  width: 50%; height: 100%;
  border-radius: 0 100% 100% 0 / 50%;
  left: 50%;
  background-color: inherit;
  transform-origin: left;
  transform: rotate(45deg);
}
```

目前实现 0-50% 的加载没有问题， 但是在实现 50%-100% 时是无法正确显示的：

![45deg 是正确](./screenshot_316.png)

![145deg 时错误](./screenshot_317.png)

- 4.利用 `animation` 解决问题：

```css
div::before {
  animation:
    spin 50s linear infinite,
    bg 100s step-end infinite;
  /* 停止当前动画播放 */
  animation-play-state: paused;
  /* 将动画“前进”到某个状态 */
  animation-delay: -20s;
}

@keyframes spin {
  to {
    transform: rotate(.5turn);
  }
}

@keyframes bg {
  50% {
    background-color: skyblue;
  }
}
```

最后， 只需要调节 `animation-delay` 的值， 就可以调节百分比了， 如 `animation-delay: -20s` 就对应 20%。

