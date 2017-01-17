/* @flow */
import parse from './src/CssParser';
import * as Transforms from './src/Transforms';

export default {
  parse,
  ...Transforms
}
