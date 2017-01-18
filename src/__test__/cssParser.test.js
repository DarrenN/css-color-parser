/*global describe, it */

import expect from 'expect';
import parse from '../CssParser';

const rFuncs = /rgba|rgb|hsla|hsl|lab|lch|hwb|hex/;

describe('CssParser', () => {
  describe('#parse', () => {
    it('valid CSS strings return Parsed object', () => {
      const css = [
        '#039',
        '#0394',
        '#003399',
        '#003399aa'
      ];

      css.forEach(c => {
        const r = parse(c);
        expect(r).toIncludeKeys(['func', 'alpha']);
        expect(r.func).toMatch(rFuncs);
      });
    });

    it('invalid CSS strings return Parsed object', () => {
      const css = [
        '#',
        '',
        12,
        'ffffff'
      ];

      css.forEach(c => {
        const r = parse(c);
        expect(r).toIncludeKeys(['status', 'message', 'parseString',
                                 'location']);
        expect(r.status).toEqual('error');
      });
    });
  });
});
