---
title: 谈谈入职外企一个月的感受
date: 2021-06-26 22:13:44
tags: untagged
categories: Uncategorize
---

最近换工作来了外企，到现在刚好一个月，记录一下目前为止的感受...

## “所谓的养老”

来之前有人和我说这是一个养老厂，但到目前为止，我还没有这样的感受。

首先，工作量其实并没有传说中的那么少，所谓的一天写 3-4 个小时代码即可是不太现实的。

同事们对待工作都非常认真，下班时间也会看到有代码提交，也会有人在群里聊天，晚上也会有人加班。当然不要误会，这并不是所谓的“奋斗”，因为大家并没有这样的概念，也没有这样的偏见，大家都想把自己的工作做好，仅此而已，反而这让我肃然起敬。

公司也有很多分享，甚至我才刚来不久，领导就张罗我给大家分享一些过去的经验和技术积累，给我带来了不小的压力。

我认为这是健康的工作状态。另外，公司还有定期的外教课让员工提高英语。

## 单元测试

公司对单元测试的要求非常严格，虽然目前还没有明确的指标，但基本上每个模块最终都会覆盖单元测试。

单测的主要覆盖范围：

- React 组件
  - 组件树的关键节点
	- 关键属性
- 业务逻辑

这恰是国内公司缺乏的，也是我来外企的主要原因之一。

## 流程！流程！流程！

国内公司和外企的很大区别其实主要就是流程。

敏捷开发。

这在国内其实也是一个非常普遍的工具，从小公司，到独角兽，到大厂都会说自己遵守敏捷开发的流程。但从我目前来看，其实都只是遵循了一部分。

敏捷的工具其实都一样：confluence + jira。

从我的经历和了解到的信息来看，猿司的敏捷开发实践在国内应该算是很不错的了：

```
需求评审 -> story
UI/UE 评审
QA case 评审
Scrum 会议进行需求排期
 每个 story 都会由大家一起预估工作量
 每个 release 大家的工作量都比较稳定
 对上一个 release 的需求进行 demo
开发 & 测试 & 上线
 开发完成
 提交给测试
 通过测试后大多由开发合并代码 & 上线
```

两个公司的流程其实大体上是比较相似的，区别主要在于一些细节：

```diff
  需求评审 -> story
+  开发需要把整个 story 的 impact 全部列出
+  开发需要和 team leader/partner 一起完成技术方案的设计，主要是画出类图、流程图、时序图
  UI/UE 评审
  QA case 评审
+  和 QA 商量各个功能/修改的测试方式，影响范围
+ 项目分配由 team leader 完成
+ 技术方案评审会
+ Planning 会议进行需求排期
+  确定 deadline
+  确定优先级
+ release 复盘会
+  - kudos 你的同事
+  - 反馈你所遇到的问题，并分配给相应的人负责解决
+ 给各大管理层 demo
  开发 & 测试 & 上线
+  开发完成后，需要把 story 标记为 resolve，并 comment 测试链接
+  QA 会根据 comment 信息进行测试
+  通过测试后，你的代码将由 QA 合并
+  最终的上线分支每天都会 build
```

并不是说所有外企都是这样的流程，不同的业务一定会有对应的调整。但外企在细节上会做的更好，国内公司的流程其实大部分都是围绕开发人员的。

## WLB & WFH

WLB 自然不用多说了，公司认可员工是需要个人时间的，所以这方面没啥好说的，按照 8:30 - 17:30 的工作时间即可，总的来说大家的生活幸福感很高。

由于疫情催生了 WFH 的工作方式，国外不少公司都在逐渐推广这种办公模式。而公司作为即时通讯行业的领头羊，更是崇尚 Work From Anywhere 的理念。目前，半年以上的远程办公需要特殊申请，否则只需要在系统里申请即可。

这种工作模式其实还是非常灵活的，可以很大程度上提高工作的幸福感，希望国内公司慢慢也可以有限的支持。

## 不足

分工非常明确，一个大的产品线会细分出很多的小部门，所以基本上每个人只会和自己 Own 的部分打交道。

在这样的分工和流程下，每个人真的都是螺丝钉，不考虑技术层面的影响力的话，任何人的离去都不会产生影响（虽然国内公司也是如此，但国内程序员对业务的影响力其实也很大）。

目前为止大致是这些感受，一些碎碎念，记录一下...
