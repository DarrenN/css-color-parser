// @flow

declare type ErrorOffset = {
  offset: number,
  line: number,
  column: number
};

declare type ErrorLocation = {
  start: ErrorOffset,
  end: ErrorOffset
};

declare type ParseError = {
  status: 'error',
  message: string,
  parseString: string,
  location: ErrorLocation
};

declare type Result = ColorObject | ParseError;

declare module "parser" {
  declare module.exports: {
    parse(input: string, options: Object): Array<Object>;
  }
}
