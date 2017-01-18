// @flow

import Parser from './parser';

export default function parse(cssStr: string): Result {
  try {
    const str = String(cssStr);

    if (!str.length) {
      return {
        status: 'error',
        message: 'Cannot parse an empty string',
        parseString: '',
        location: {
          start: {offset: 1, line: 1, column: 1},
          end: {offset: 1, line: 1, column: 1}
        }
      };
    };

    let [parsed]: Array<ColorObject> = Parser.parse(str);
    parsed.format = [];
    return parsed;

  } catch (e) {
    const {message, location} = e;
    // message: string, location: ErrorLocation

    return {
      status: 'error',
      message,
      parseString: cssStr,
      location
    };
  }
}
