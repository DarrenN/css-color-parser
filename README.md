# css-color-parser

Parse CSS Level 4 Color Strings

:warning: **Super Beta, you have been warned **

Uses a PEG grammar to parse CSS Level 4 color functions into a data structure that can be easily manipulated. Will also render out strings in a CSS color function format (see below).

To get running:

```bash
$ npm install
$ npm run build:parser
$ npm run build:dev
$ npm run test:single
```

It does things:

```bash
$ node
> var c = require('./dist/index.js').default
undefined
> var p = c.parse('hsl(120, 45%, 65%)')
undefined
> p
{ func: 'hsl',
  h: 0.3333333333333333,
  s: 0.45,
  l: 0.65,
  alpha: 1,
  format: [] }
> c.makeString(c.hueToDegrees(c.includeAlpha(p)))
'hsla(120deg, 45%, 65%, 1)'
```
