'use strict';

const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

hexo.extend.filter.register('after_render:html', async function(str, data) {
  const section = this.config.neat_html || {};

  if (!isMinifyEnabled(this.config, section) || isExcluded(data.path, section.exclude)) {
    return str;
  }

  return minifyHtml(str, Object.assign({
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
  }, section.options));
});

hexo.extend.filter.register('after_render:css', function(str, data) {
  const section = this.config.neat_css || {};

  if (!isMinifyEnabled(this.config, section) || isExcluded(data.path, section.exclude)) {
    return str;
  }

  return new CleanCSS(section.options || {}).minify(str).styles;
});

hexo.extend.filter.register('after_render:js', async function(str, data) {
  const section = this.config.neat_js || {};

  if (!isMinifyEnabled(this.config, section) || isExcluded(data.path, section.exclude)) {
    return str;
  }

  const result = await minifyJs(str, {
    compress: section.compress == null ? true : section.compress,
    format: section.output || {},
    mangle: section.mangle !== false
  });

  return result.code || str;
});

function isMinifyEnabled(config, section) {
  return config.neat_enable !== false && section.enable !== false;
}

function isExcluded(filePath, patterns) {
  if (!patterns) {
    return false;
  }

  const normalizedPath = String(filePath || '').replace(/\\/g, '/');
  const list = Array.isArray(patterns) ? patterns : [patterns];

  return list.some(pattern => matchesPattern(normalizedPath, String(pattern)));
}

function matchesPattern(filePath, pattern) {
  if (!pattern) {
    return false;
  }

  if (pattern.startsWith('*.')) {
    return filePath.endsWith(pattern.slice(1));
  }

  if (!pattern.includes('*')) {
    return filePath === pattern || filePath.endsWith(`/${pattern}`);
  }

  const expression = pattern
    .split('*')
    .map(escapeRegExp)
    .join('.*');

  return new RegExp(`^${expression}$`).test(filePath);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
