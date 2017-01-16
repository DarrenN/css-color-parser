// @flow

declare module "parser" {
  declare module.exports: {
    parse(input: string, options: Object): Array<Object>;
  }
}

// function peg$parse(input, options) {
// function peg$SyntaxError(message, expected, found, location) {
