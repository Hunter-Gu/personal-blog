---
title: webpack 的模块化
date: 2019-03-03 12:45:59
categories: Frontend
tags: webpack
---

上一篇文章[《认识 webpack》](/personal-blog/2019/02/20/know-webpack/#more)中说到, webpack 通过 babel 将 `import` 转换为 `require()`, 再将 `require()` 准换为其 `__webpack_require__()` 方法以实现“模块化”, 这篇文章就来分析一下 `__webpack_require__()` 实现“模块化”的方式。

> 注: 代码可能会被优化, 所以可能不同于 webpack 生成后的代码。

## 静态加载

即 `import`, 这是最常见, 也是最常用的加载方式。 因为 webpack 有 dynamic import 方式, 所以将这种模块加载方式命名为静态加载来与之对应。 下面开始对静态加载进行分析。

被 webpack 中 loader 处理的每一个模块, 最终会输出为一个或多个函数(如被 babel-loader 处理后的 ES Next 代码, 如果使用了 runtime plugin, 就会生成额外的 ES6 语法的 polyfill 函数), 这些函数被称为 webpack 处理后的模块, 大致代码如下:

```js
(function(modules) {})([
  // module 0
  function() {},
  // module 1
  function() {},
  // module 2
  function() {}
]);
```

`__webpack_require__()` 方法用于根据 moduleId 注册指定模块; 并且加载过的模块会被缓存, 以避免重复加载, 其中:

- moduleId: 实际就是指定 module 的索引;
- 注册模块: 实际就是调用指定的 module 方法, 会从 entry 模块开始。

```js
(function(modules) {
  var installedModules = {};

  // moduleId 是指定模块的索引
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) return installedModules[moduleId].exports;

    var module = (installedModules[moduleId] = {
      moduleId: moduleId,
      loaded: false,
      exports: {}
    });

    // 调用模块方法
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    module.loaded = true;

    return module.exports;
  }

  return __webpack_require__(0);
})([
  // 假设是 entry
  // module 0
  function(module, exports, __webpack_require__) {},
  // module 1
  function(module, exports, __webpack_require__) {},
  // module 2
  function(module, exports, __webpack_require__) {}
]);
```

接着只需要设置 exports 值即可, webpack 支持 ES6 module 和 CommonJS 方式:

```js
export test = 'test'

export default 'test'

module.exports = 'test'

exports['test'] = 'test'
```

上面这些方式分别会被转换为:

```js
exports['default'] = 'test';

exports['test'] = 'test';

modules.exports = 'test';

exports['test'] = 'test';
```

可以看到 ES6 module 和 CommonJS 方式生成的 exports 是不同的。 那么 webapck 是怎么把这些方式统一起来方便使用的呢? 通过给 exports 添加额外的 \_\_esModule 标记标识 ES6 module 模块:

```js
var hasOwnProperty = function(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
};

var defineProperty = function(exports, name, getter) {
  if (!hasOwnProperty(exports, name)) {
    Object.defineProperty(exports, name, {
      enumerable: true,
      get: getter
    });
  }
};

function __webpack_require__() {
  //...
}

// define __esModule on exports
__webpack_require__.defineEsModule = function(exports) {
  defineProperty(exports, '__esModule', function() {
    return true;
  });
};

// 和导出的 default 属性区分开
__webpack_require__.getDefaultExports = function(exports) {
  const getter =
    exports && exports['__esModule']
      ? function getDefault() {
          return exports['default'];
        }
      : function getModuleExports() {
          return exprots;
        };

  defineProperty(getter, 'a', getter);

  return getter;
};
```

所以在模块中, 我们就可以通过 `getDefaultExports()` 方法来获取导出的值。 下面是示例代码:

```js
// entry
import test1Default, { test1 } from './test1.js';
import test2 from './test2.js';
import test3 from './test3.js';

// test1.js
export default 'test1Default';

export const test1 = 'test1';

// test2.js
module.exports = 'test2';

// test3.js
exports.test3 = 'test3';
```

最终会被转换为:

```js
(function() {})([
  function(module, exports, __webpack_require__) {
    __webpack_require__.defineEsModule(exports);
    var _test1_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
    var _test2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2);
    var _test2_js__WEBPACK_IMPORTED_MODULE_2___default = __webpack_require__.getDefaultExports(
      _test2_js__WEBPACK_IMPORTED_MODULE_2__
    );
    var _test3_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3);
    var _test3_js__WEBPACK_IMPORTED_MODULE_3___default = __webpack_require__.getDefaultExports(
      _test3_js__WEBPACK_IMPORTED_MODULE_3__
    );

    // 获取到的依赖模块的导出值
    _test1_js__WEBPACK_IMPORTED_MODULE_1__['default']; // 'test1Default'
    _test1_js__WEBPACK_IMPORTED_MODULE_1__['test1']; // 'test1'
    _test2_js__WEBPACK_IMPORTED_MODULE_2___default(); // 'test2'
    _test3_js__WEBPACK_IMPORTED_MODULE_3__['test3']; // 'test3'
  },
  // module 1
  function(module, exports, __webpack_require__) {
    __webpack_require__.defineEsModule(exports);
    __webpack_require__.defineProperty(exports, 'test1', function() {
      return test1;
    });
    exports['default'] = 'test1Default';
    var test1 = 'test1';
  },
  // module 2
  function(module, exports, __webpack_require__) {
    module.exports = 'test2';
  },
  // module 3
  function(module, exports, __webpack_require__) {
    exports.test3 = 'test';
  }
]);
```

完整代码如下:

```js
(function(modules) {
  var installedModules = {};

  // moduleId 是指定模块的索引
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) return installedModules[moduleId].exports;

    var module = (installedModules[moduleId] = {
      moduleId: moduleId,
      loaded: false,
      exports: {}
    });

    // 调用模块方法
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    module.loaded = true;

    return module.exports;
  }

  var hasOwnProperty = function(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  __webpack_require__.defineProperty = function(exports, name, getter) {
    if (!hasOwnProperty(exports, name)) {
      Object.defineProperty(exports, name, {
        enumerable: true,
        get: getter
      });
    }
  };

  // define __esModule on exports
  __webpack_require__.defineEsModule = function(exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  __webpack_require__.getDefaultExports = function(exports) {
    const getter =
      exports && exports['__esModule']
        ? function getDefault() {
            return exports['default'];
          }
        : function getModuleExports() {
            return exports;
          };

    // 和导出的 default 属性区分开
    __webpack_require__.defineProperty(getter, 'a', getter);

    return getter;
  };

  return __webpack_require__(0);
})([
  // 假设是 entry
  // module 0
  function(module, exports, __webpack_require__) {
    __webpack_require__.defineEsModule(exports);
    var _test1_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
    var _test2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2);
    var _test2_js__WEBPACK_IMPORTED_MODULE_2___default = __webpack_require__.getDefaultExports(
      _test2_js__WEBPACK_IMPORTED_MODULE_2__
    );
    var _test3_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3);
    var _test3_js__WEBPACK_IMPORTED_MODULE_3___default = __webpack_require__.getDefaultExports(
      _test3_js__WEBPACK_IMPORTED_MODULE_3__
    );

    // 获取到的依赖模块的导出值
    _test1_js__WEBPACK_IMPORTED_MODULE_1__['default']; // 'test1Default'
    _test1_js__WEBPACK_IMPORTED_MODULE_1__['test1']; // 'test1'
    _test2_js__WEBPACK_IMPORTED_MODULE_2___default(); // 'test2'
    _test3_js__WEBPACK_IMPORTED_MODULE_3__['test3']; // 'test3'
  },
  // module 1
  function(module, exports, __webpack_require__) {
    __webpack_require__.defineEsModule(exports);
    __webpack_require__.defineProperty(exports, 'test1', function() {
      return test1;
    });
    exports['default'] = 'test1Default';
    var test1 = 'test1';
  },
  // module 2
  function(module, exports, __webpack_require__) {
    module.exports = 'test2';
  },
  // module 3
  function(module, exports, __webpack_require__) {
    exports.test3 = 'test';
  }
]);
```

## 动态加载

webpack 中的动态加载推荐采用 ECMASciprt 提案中的 `import()` 语法, 使用该方法后所有动态加载的代码会被打包到一个单独的 chunk 中, 然后通过 `<script>` 标签的方式在需要时按需加载, 我们先看一下这一部分的代码:

```js
const installedChunks = {}

function jsonpScriptSrc (chunkId) {
  return __webpack__require__.p + '' + chunkId + '.js'
}

__webpack__require__.requireEnsure = function requireEnsure (chunkId) {
  const promises = []
  const installedChunkData = installedChunks[chunkId]

  // 表示没有加载过该 chunk
  if (installedChunkData !== 0) {
    // 表示正在加载
    if (installedChunkData) {
      // 是一个 promise
      // 0: resolve, 1: reject, 2: promise
      promises.push(installedChunkData[2])
    } else {
      const promise = new Promise(function (resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject]
      })

      promises.push(installedChunkData[2] = promise)

      const script = document.createElement('script')
      const onScriptComplete = function (evt) {
        const chunk = installedChunks[chunkId]
        script.onload = script.onerror = null
        clearTimeout(timeout)

        // 没有加载完成
        if (chunk !== 0) {
          if (chunk) {
            const errorType = evt && (evt.type === 'load' ? 'missing' : evt.type);
            const realSrc = evt && evt.target && evt.target.src;
            const error = new Error('Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')');
            error.type = errorType;
            error.request = realSrc;
          }
          installedChunks[chunkId] = undefined
        }
        var timeout = setTimeout(function () {
          onScriptComplete({type: 'timeout', target: script })
        }, 120000)
        script.charset = 'utf-8'
        script.src = jsonpScriptSrc(chunkId)
        script.timeout = 120
        script.onload = script.onerror = onScriptComplete
        document.head.appendChild(script)
      }
    }
  }

  return Promise.all(promises)
}

__webpack__require__.p = <output.publicPath>
```

上面的代码略长, 简单来说就是: 通过 `<script>` 标签加载指定的 chunk 文件, 并且在 `installedChunk[chunkId]` 中保存了此次的 promise, 并返回了一个 `Promise.all(...)`。 我们设想的当然是在 chunk 加载完后, 把此次的 promise 执行 `resolve()`。

webpack 中的方式是在 `window` 对象上挂载一个全局方法 `webpackJsonpCallback`, chunk 中是一个会自动调用该方法的立即执行函数:

```js
function webpackJsonpCallback(data) {
  const chunkIds = data[0];
  const moreModules = data[1];
  const resolves = [];

  for (let i = 0; i < chunkIds.length; i++) {
    const chunkId = chunkIds[i];
    if (installedChunks[chunkId]) {
      resolves.push(installedChunks[chunkId][0]);
    }
    installedChunks[chunkId] = 0;
  }

  for (const moduleId in moreModules) {
    if (__webpack__require__.o(moreModules, moduleId)) {
      modules[moduleId] = moreModules[moduleId];
    }
  }

  if (parentJsonpFunction) parentJsonpFunction(data);

  while (resolves.length) resolves.shift()();
}

// webpack vendor
const jsonArray = (window['webpackJsonpTest'] = window[
  'webpackJsonpTest'
] = []);
// 相当于 window['webpackJsonpTest'].push.bind(window['webpackJsonpTest'])
// 之后执行该方法时, 会把值 push 到 window['webpackJsonpTest'] 中
const oldJsonpFunction = jsonArray.push.bind(jsonArray);
const parentJsonpFunction = oldJsonpFunction;
window['webpackJsonpTest'].webpackJsonpCallback = webpackJsonpCallback;

// 复原 jsonpArray
jsonpArray = jsonpArray.slice();
```

chunk 中的代码:

```js
(window["webpackJsonpTest"] = window["webpackJsonpTest"] || []).push([
  [<chunk-name>],
  {
    // 4 是 chunk splitting 前的 moduleId
    4: function (module, exports) {
      exports['default'] = 'test'
    }
  }
])
```

在加载完 chunk 中的 module 后, 还要把该 module 注册到我们的 modules 中, 方便后序的使用:

```js
__webpack__require__.t = function(value, mode) {
  // 将从 chunk 中加载到的 module 注册到 modules 上
  if (mode & 1) value = __webpack__require__(value);
  if (mode & 8) return value;
  if (mode & 4 && typeof value === 'object' && value && value.__esModule)
    return value;
  const tmp = Object.create(null);
  // 定义 __esModule 属性
  __webpack__require__.r(tmp);
  Object.defineProperty(tmp, 'default', { enmerable: true, value });
  // 将所有值 copy 到 tmp 上并返回
  if (mode & 2 && typeof value !== 'string') {
    for (const key in value) {
      __webpack__require__.d(
        tmp,
        key,
        function() {
          return value[key];
        }.bind(null, key)
      );
    }
  }

  return tmp;
};
```

再看一下 `import()` 最终会被转换哪种形式:

```js
function (module, exports, __webpack_require__) {
  __webpack_require__.requireEnsure('<chunk-name>')
    .then(__webpack_require__.t.bind(null, '<moduleId>', 7))
    .then(module => {

    })
}
```

最后, 动态加载部分的完整代码如下:

```js
(function(modules) {
  const installedModules = {};
  const installedChunks = {};

  function webpackJsonpCallback(data) {
    const chunkIds = data[0];
    const moreModules = data[1];
    const resolves = [];

    for (let i = 0; i < chunkIds.length; i++) {
      const chunkId = chunkIds[i];
      if (installedChunks[chunkId]) {
        resolves.push(installedChunks[chunkId][0]);
      }
      installedChunks[chunkId] = 0;
    }

    for (const moduleId in moreModules) {
      if (__webpack__require__.o(moreModules, moduleId)) {
        modules[moduleId] = moreModules[moduleId];
      }
    }

    if (parentJsonpFunction) parentJsonpFunction(data);

    while (resolves.length) resolves.shift()();
  }

  function jsonpScriptSrc(chunkId) {
    return __webpack__require__.p + '' + chunkId + '.js';
  }

  // moduleId 是 modules 中的某一个索引
  // module 是一个函数
  function __webpack__require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    const module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    });

    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack__require__
    );

    module.l = true;

    return module.exports;
  }

  __webpack__require__.o = function hasOwnProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  __webpack__require__.d = function defineGetterProperty(
    exports,
    name,
    getter
  ) {
    if (!__webpack__require__.o(exports, name)) {
      Object.defineProperty.call(null, exports, name, {
        enmerable: true,
        get: getter
      });
    }
  };

  __webpack__require__.r = function defineEsModule(exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  __webpack__require__.n = function getExportDefault(exports) {
    const getter = exports.__esModule
      ? function() {
          return exports.default;
        }
      : function() {
          return exports;
        };

    __webpack__require__.d(getter, 'a', getter);

    return getter;
  };

  __webpack__require__.t = function(value, mode) {
    // value is a module id
    if (mode & 1) value = __webpack__require__(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === 'object' && value && value.__esModule)
      return value;
    const tmp = Object.create(null);
    __webpack__require__.r(tmp);
    Object.defineProperty(tmp, 'default', { enmerable: true, value });

    if (mode & 2 && typeof value !== 'string') {
      for (const key in value) {
        __webpack__require__.d(
          tmp,
          key,
          function() {
            return value[key];
          }.bind(null, key)
        );
      }
    }

    return tmp;
  };

  // loadAdditionalChunks
  __webpack__require__.e = function requireEnsure(chunkId) {
    const promises = [];
    let installedChunkData = installedChunks[chunkId];
    if (installedChunkData !== 0) {
      // 正在加载
      if (installedChunkData) {
        promises.push(installedChunkData[2]);
      } else {
        const promise = new Promise(function(resolve, reject) {
          installedChunkData = installedChunks[chunkId] = [resolve, reject];
        });

        promises.push((installedChunkData[2] = promise));

        const script = document.createElement('script');
        const onScriptComplete = function(evt) {
          script.onerror = script.onload = null;
          clearTimeout(timeout);
          const chunk = installedChunks[chunkId];
          if (chunk !== 0) {
            if (chunk) {
              const errorType =
                evt && (evt.type === 'load' ? 'missing' : evt.type);
              const realSrc = evt && evt.target && evt.target.src;
              const error = new Error(
                'Loading chunk ' +
                  chunkId +
                  ' failed.\n(' +
                  errorType +
                  ': ' +
                  realSrc +
                  ')'
              );
              error.type = errorType;
              error.request = realSrc;
            }
            installedChunks[chunkId] = undefined;
          }
        };
        var timeout = setTimeout(function() {
          onScriptComplete({ type: 'timeout', target: script });
        }, 120000);
        script.charset = 'utf-8';
        script.src = jsonpScriptSrc(chunkId);
        script.timeout = 120;
        script.onload = script.onerror = onScriptComplete;
        document.head.appendChild(script);
      }
    }

    return Promise.all(promises);
  };

  __webpack__require__.p = ''; // '{{ publicPath }}'

  let jsonpArray = (window['webpackJsonpTest'] = window[
    'webpackJsonpTest'
  ] = []);
  const oldJsonpFunction = window['webpackJsonpTest'].push.bind(
    window['webpackJsonpTest']
  );
  window['webpackJsonpTest'].push = webpackJsonpCallback; // 改写 push
  jsonpArray = jsonpArray.slice();
  var parentJsonpFunction = oldJsonpFunction;

  return __webpack__require__(0);
})([
  // 0 entry
  function(module, __exports, __require) {
    __require
      .e('chunks')
      .then(__require.t.bind(null, 14, 7))
      .then(module => {});
  }
]);
```

chunk 完整代码:

```js
(window['webpackJsonpTest'] = window['webpackJsonpTest'] || []).push([
  ['chunks'],
  {
    14: function(module, exports) {
      exports['default'] = 'test';
    }
  }
]);
```
