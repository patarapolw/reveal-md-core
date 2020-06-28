# @patarapolw/reveal-md-core

A framework for manipulating Reveal.js <--> Markdown. With Showdown extensions and [HyperPug](https://github.com/patarapolw/hyperpug). See <https://patarapolw.github.com/reveal-editor>

## Features

- Global scripting `<script></script>` and styling `<style></style>` is now supported in slides marked with

```markdown
// global
content (Pug or HTML or extended Markdown)
```

- The slides marked with `// global` or `// hidden` will be hidden.

## Live editor

See <https://github.com/patarapolw/reveal-md>.

## Installation

```sh
npm i @patarapolw/reveal-md-core.git
```

## Local Reveal.js files

This can be done by serving [Reveal.js](https://github.com/hakimel/reveal.js) folder from `/reveal`, either via the same web server, or via proxy. It will be loaded automatically.
