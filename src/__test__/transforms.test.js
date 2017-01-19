/*global describe, it, beforeEach, afterEach */

import * as S from '../Strings';
import * as T from '../Transforms';
import * as _ from 'lodash/fp';
import expect from 'expect';
import jsc from 'jsverify';
import parse from '../CssParser';

function intToHex(n) {
  n = parseInt(n,10);
  if (isNaN(n)) return "00";
  n = Math.max(0,Math.min(n,255));
  const o = "0123456789ABCDEF".charAt((n - n % 16) / 16)
    + "0123456789ABCDEF".charAt(n % 16);

  return o.toLowerCase();
}

const fixedArray = (gen, len) => {
  var tuple = Array.apply(null, Array(len)).map(() => gen);
  return jsc.tuple(tuple);
};

const rgbIntTriplet = fixedArray(jsc.integer(0, 255), 3);
const rgbIntQuad = fixedArray(jsc.integer(0, 255), 4);
const percentTriplet = fixedArray(jsc.integer(0, 100), 3);
const labTriplet = fixedArray(jsc.integer(0, 1000), 3);

const labPercentQuad = jsc.tuple([
  jsc.integer(1, 1000),
  jsc.integer(1, 1000),
  jsc.integer(1, 1000),
  jsc.integer(1, 100),
]);

const hslIntTriplet = jsc.tuple([
  jsc.integer(1, 360),
  jsc.integer(0, 100),
  jsc.integer(0, 100)
]);

const hslaPercentQuad = jsc.tuple([
  jsc.integer(1, 360),
  jsc.integer(0, 100),
  jsc.integer(0, 100),
  jsc.integer(0, 100)
]);

const rgbaPercentQuad = jsc.tuple([
  jsc.integer(0, 250),
  jsc.integer(0, 250),
  jsc.integer(0, 250),
  jsc.integer(0, 100)
]);

const reHex3 = /#[0-9a-fA-F]{3}/;
const reHex4 = /#[0-9a-fA-F]{4}/;
const reHex6 = /#[0-9a-fA-F]{6}/;
const reHex8 = /#[0-9a-fA-F]{8}/;

function hexAlpha(alpha) {
  if (!alpha) return 1;
  let a = parseInt(alpha, 16);
  return a / 255;
}

describe('Transforms', () => {
  describe('conversions', () => {

    describe('Correctly parses Hex codes', () => {
      it('parses 8 digit hex codes into RGBA', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const hex = "#" + [r, g, b, a].map(intToHex).join('');
          const p = parse(hex);

          return(p.func === 'hex'
                 && _.isNumber(p.r) && (p.r === r / 255)
                 && _.isNumber(p.g) && (p.g === g / 255)
                 && _.isNumber(p.b) && (p.b === b / 255)
                 && _.isNumber(p.alpha)
                 && p.alpha === hexAlpha(intToHex(a))
                 && p.hex === hex
                );
        });

        jsc.assert(property);
      });

      it('parses 6 digit hex codes into RGBA', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const hex = "#" + [r, g, b].map(intToHex).join('');
          const p = parse(hex);

          return(p.func === 'hex'
                 && _.isNumber(p.r) && (p.r === r / 255)
                 && _.isNumber(p.g) && (p.g === g / 255)
                 && _.isNumber(p.b) && (p.b === b / 255)
                 && _.isNumber(p.alpha)
                 && p.alpha === 1
                 && p.hex === hex
                );
        });

        jsc.assert(property);
      });

      it('parses 4 digit hex codes into RGBA', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const [pr, pg, pb, pa] = [r, g, b, a].map(intToHex);
          const [tr, tg, tb, ta] = [pr[0], pg[0], pb[0], pa[0]].map(n => {
            return parseInt(`${n}${n}`, 16) / 255;
          });
          const hex = `#${pr[0]}${pg[0]}${pb[0]}${pa[0]}`;
          const p = parse(hex);

          return(p.func === 'hex'
                 && _.isNumber(p.r) && (p.r === tr)
                 && _.isNumber(p.g) && (p.g === tg)
                 && _.isNumber(p.b) && (p.b === tb)
                 && _.isNumber(p.alpha)
                 && T.toSafePercent(p.alpha) === T.toSafePercent(ta)
                 && p.hex === hex
                );
        });

        jsc.assert(property);
      });

      it('parses 3 digit hex codes into RGBA', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const [pr, pg, pb] = [r, g, b].map(intToHex);
          const hex = `#${pr[0]}${pg[0]}${pb[0]}`;
          const p = parse(hex);

          return(p.func === 'hex'
                 && _.isNumber(p.r)
                 && _.isNumber(p.g)
                 && _.isNumber(p.b)
                 && _.isNumber(p.alpha)
                 && p.alpha === 1
                 && p.hex === hex
                );
        });

        jsc.assert(property);
      });
    });

    describe('Correctly parses color functions', () => {
      it('rgb(Int, Int, Int)', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = `rgb(${r}, ${g}, ${b})`;
          const p = parse(s);
          return (p.func === 'rgb'
                  && _.isNumber(p.r)
                  && _.isNumber(p.g)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('rgb(Percent, Percent, Percent)', () => {
        let property = jsc.forall(percentTriplet, (arr) => {
          const [r, g, b] = arr;
          const s = `rgb(${r}%, ${g}%, ${b}%)`;
          const p = parse(s);
          return (p.func === 'rgb'
                  && _.isNumber(p.r)
                  && _.isNumber(p.g)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('rgba(Int, Int, Int, Percent)', () => {
        let property = jsc.forall(rgbaPercentQuad, ([r, g, b, a]) => {
          const s = `rgb(${r}, ${g}, ${b}, ${a}%)`;
          const p = parse(s);
          return (p.func === 'rgb'
                  && _.isNumber(p.r)
                  && _.isNumber(p.g)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('rgba(Int, Int, Int, Float)', () => {
        let property = jsc.forall(rgbaPercentQuad, ([r, g, b, a]) => {
          const s = `rgb(${r}, ${g}, ${b}, ${a / 100})`;
          const p = parse(s);
          return (p.func === 'rgb'
                  && _.isNumber(p.r)
                  && _.isNumber(p.g)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hsl(Int, Percent, Percent)', () => {
        let property = jsc.forall(hslIntTriplet, (arr) => {
          const [h, s, l] = arr;
          const x = `hsl(${h}, ${s}%, ${l}%)`;
          const p = parse(x);
          return (p.func === 'hsl'
                  && _.isNumber(p.h)
                  && _.isNumber(p.s)
                  && _.isNumber(p.l)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hsl(Int deg, Percent, Percent)', () => {
        let property = jsc.forall(hslIntTriplet, (arr) => {
          const [h, s, l] = arr;
          const x = `hsl(${h}deg, ${s}%, ${l}%)`;
          const p = parse(x);
          return (p.func === 'hsl'
                  && _.isNumber(p.h)
                  && _.isNumber(p.s)
                  && _.isNumber(p.l)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hsla(Int, Percent, Percent, Percent)', () => {
        let property = jsc.forall(hslaPercentQuad, (arr) => {
          const [h, s, l, a] = arr;
          const x = `hsl(${h}, ${s}%, ${l}%, ${a}%)`;
          const p = parse(x);
          return (p.func === 'hsl'
                  && _.isNumber(p.h)
                  && _.isNumber(p.s)
                  && _.isNumber(p.l)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hsla(Int, Percent, Percent, Float)', () => {
        let property = jsc.forall(hslaPercentQuad, (arr) => {
          const [h, s, l, a] = arr;
          const x = `hsl(${h}, ${s}%, ${l}%, ${a / 100})`;
          const p = parse(x);
          return (p.func === 'hsl'
                  && _.isNumber(p.h)
                  && _.isNumber(p.s)
                  && _.isNumber(p.l)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });


      it('hwb(Int deg, Percent, Percent)', () => {
        let property = jsc.forall(hslIntTriplet, (arr) => {
          const [h, w, b] = arr;
          const x = `hwb(${h}deg, ${w}%, ${b}%)`;
          const p = parse(x);
          return (p.func === 'hwb'
                  && _.isNumber(p.h)
                  && _.isNumber(p.w)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hwb(Int, Percent, Percent)', () => {
        let property = jsc.forall(hslIntTriplet, (arr) => {
          const [h, w, b] = arr;
          const x = `hwb(${h}, ${w}%, ${b}%)`;
          const p = parse(x);
          return (p.func === 'hwb'
                  && _.isNumber(p.h)
                  && _.isNumber(p.w)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                 );
        });

        jsc.assert(property);
      });

      it('hwb(Int, Percent, Percent, Float)', () => {
        let property = jsc.forall(hslaPercentQuad, (arr) => {
          const [h, w, b, a] = arr;
          const x = `hwb(${h}, ${w}%, ${b}%, ${a / 100})`;
          const p = parse(x);

          return (p.func === 'hwb'
                  && _.isNumber(p.h)
                  && _.isNumber(p.w)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                  && _.isEqual(Math.round(p.alpha * 100), a)
                 );
        });

        jsc.assert(property);
      });

      it('lab(Int, Int, Int)', () => {
        let property = jsc.forall(labTriplet, (arr) => {
          const [l, a, b] = arr;
          const x = `lab(${l}, ${a}, ${b})`;
          const p = parse(x);
          return (p.func === 'lab'
                  && _.isNumber(p.l)
                  && _.isNumber(p.a)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                  && (p.l <= 100)
                 );
        });

        jsc.assert(property);
      });

      it('lab(Int, Int, Int, Float)', () => {
        let property = jsc.forall(labPercentQuad, (arr) => {
          const [l, a, b, al] = arr;
          const x = `lab(${l}, ${a}, ${b}, ${al / 100})`;
          const p = parse(x);

          return (p.func === 'lab'
                  && _.isNumber(p.l)
                  && _.isNumber(p.a)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                  && _.isEqual(Math.round(p.alpha * 100), al)
                  && (p.l <= 100)
                 );
        });

        jsc.assert(property);
      });

      it('lab(Int, Int, Int, Percent)', () => {
        let property = jsc.forall(labPercentQuad, (arr) => {
          const [l, a, b, al] = arr;
          const x = `lab(${l}, ${a}, ${b}, ${al}%)`;
          const p = parse(x);

          return (p.func === 'lab'
                  && _.isNumber(p.l)
                  && _.isNumber(p.a)
                  && _.isNumber(p.b)
                  && _.isNumber(p.alpha)
                  && _.isEqual(Math.round(p.alpha * 100), al)
                  && (p.l <= 100)
                 );
        });

        jsc.assert(property);
      });

      it('lch(Int, Int, Int)', () => {
        let property = jsc.forall(labTriplet, (arr) => {
          const [l, c, h] = arr;
          const x = `lch(${l}, ${c}, ${h})`;
          const p = parse(x);
          return (p.func === 'lch'
                  && _.isNumber(p.l)
                  && _.isNumber(p.c)
                  && _.isNumber(p.h)
                  && _.isNumber(p.alpha)
                  && (p.l <= 100)
                  && (p.c <= 230)
                  && (p.h <= 360)
                 );
        });

        jsc.assert(property);
      });

      it('lch(Int, Int, Int, Float)', () => {
        let property = jsc.forall(labPercentQuad, (arr) => {
          const [l, c, h, a] = arr;
          const x = `lch(${l}, ${c}, ${h}, ${a / 100})`;
          const p = parse(x);
          return (p.func === 'lch'
                  && _.isNumber(p.l)
                  && _.isNumber(p.c)
                  && _.isNumber(p.h)
                  && _.isNumber(p.alpha)
                  && _.isEqual(Math.round(p.alpha * 100), a)
                  && (p.l <= 100)
                  && (p.c <= 230)
                  && (p.h <= 360)
                 );
        });

        jsc.assert(property);
      });

      it('lch(Int, Int, Int, Percent)', () => {
        let property = jsc.forall(labPercentQuad, (arr) => {
          const [l, c, h, a] = arr;
          const x = `lch(${l}, ${c}, ${h}, ${a}%)`;
          const p = parse(x);
          return (p.func === 'lch'
                  && _.isNumber(p.l)
                  && _.isNumber(p.c)
                  && _.isNumber(p.h)
                  && _.isNumber(p.alpha)
                  && _.isEqual(Math.round(p.alpha * 100), a)
                  && (p.l <= 100)
                  && (p.c <= 230)
                  && (p.h <= 360)
                 );
        });

        jsc.assert(property);
      });
    });

    describe('#rgbToHex', () => {
      it('RGB -> HEX', () => {
        const p = T.rgbToHex(parse('rgb(0, 33, 45)'));
        const {func, hex} = p;
        expect(p).toIncludeKeys(['func', 'hex', 'r', 'g', 'b',
                                 'alpha', 'format']);

        expect(func).toEqual('hex');
        expect(hex).toMatch(reHex6);
      });
    });

    describe('#hslToHex', () => {
      it('HSB -> HEX', () => {
        const p = T.hslToHex(parse('hsl(120, 2%, 45%)'));
        const {func, hex} = p;
        expect(p).toIncludeKeys(['func', 'hex', 'r', 'g', 'b',
                                 'alpha', 'format']);

        expect(func).toEqual('hex');
        expect(hex).toMatch(reHex6);
      });
    });

    it('RGB -> HSL', () => {
      let property = jsc.forall(rgbIntTriplet, (arr) => {
        const [r, g, b] = arr;
        const s = `rgb(${r}, ${g}, ${b})`;
        const p = T.rgbToHsl(parse(s));

        return (p.func === 'hsl'
                && _.isNumber(p.h)
                && _.isNumber(p.s)
                && _.isNumber(p.l)
                && _.isNumber(p.alpha)
        );
      });

      jsc.assert(property);
    });
  });

  describe('Formats', () => {
    let p = undefined;

    beforeEach(() => {
      p = parse('#039');
    });

    afterEach(() => {
      p = undefined;
    });

    it('format functions should not add dupes to array', () => {
      const a = T.shortHex(p);
      const b = T.shortHex(a);
      const c = T.shortHex(b);
      const {format} = c;
      expect(format.length).toEqual(1);
      expect(format[0]).toEqual(T.FORMAT_SHORTHEX);
    });

    it('#shortHex should add to format array', () => {
      const {format} = T.shortHex(p);
      expect(format.length).toEqual(1);
      expect(format[0]).toEqual(T.FORMAT_SHORTHEX);
    });

    it('#includeAlpha should add to format array', () => {
      const {format} = T.includeAlpha(p);
      expect(format.length).toEqual(1);
      expect(format[0]).toEqual(T.FORMAT_INCLUDEALPHA);
    });

    it('#intToPercent should add to format array', () => {
      const {format} = T.intToPercent(p);
      expect(format.length).toEqual(1);
      expect(format[0]).toEqual(T.FORMAT_INTTOPERCENT);
    });

    it('#hueToDegrees should add to format array', () => {
      const {format} = T.hueToDegrees(p);
      expect(format.length).toEqual(1);
      expect(format[0]).toEqual(T.FORMAT_HUETODEGREES);
    });
  });

  describe('Strings', () => {
    describe('HEX', () => {
      it('#makeString hex(hex8) -> hex6', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const s = "#" + [r, g, b, a].map(intToHex).join('');
          const s6 = s.substr(0, 7);
          const p = S.makeString(parse(s));
          return (p === s6);
        });

        jsc.assert(property);
      });

      it('#makeString hex(hex6) -> hex6', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = "#" + [r, g, b].map(intToHex).join('');
          const p = S.makeString(parse(s));
          return (p === s);
        });

        jsc.assert(property);
      });

      it('#makeString hex(hex4) -> hex6', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const [hr, hg, hb, ha] = [r, g, b, a].map(intToHex);
          const s6 = `#${hr[0]}${hr[0]}${hg[0]}${hg[0]}${hb[0]}${hb[0]}`;
          const s4 = `#${hr[0]}${hg[0]}${hb[0]}${ha[0]}`;
          const p = S.makeString(parse(s4));

          return (p === s6.toLowerCase());
        });

        jsc.assert(property);
      });

      it('#makeString hex(hex3) -> hex6', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const [hr, hg, hb] = [r, g, b].map(intToHex);
          const s6 = `#${hr[0]}${hr[0]}${hg[0]}${hg[0]}${hb[0]}${hb[0]}`;
          const s3 = `#${hr[0]}${hg[0]}${hb[0]}`;
          const p = S.makeString(parse(s3));

          return (p === s6.toLowerCase());
        });

        jsc.assert(property);
      });

      it('#makeString shortHex(hex(hex8)) -> hex3/6', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          let ps8, ps3, s6;
          const pairs = [r, g, b, a].map(intToHex);

          const s = "#" + pairs.join('');
          s6 = s.substr(0, 7);

          const ms = pairs.map(x => {
            return `${x[0]}${x[0]}`;
          });

          const [mr, mg, mb] = ms;
          ps8 = "#" + ms.join('');
          ps3 = `#${mr[0]}${mg[0]}${mb[0]}`;

          const p1 = S.makeString(T.shortHex(parse(s)));
          const p2 = S.makeString(T.shortHex(parse(ps8)));

          return (p1 === s6);
          return (p2 === ps3);

          return true;
        });

        jsc.assert(property);
      });

      it('#makeString shortHex(hex(hex6)) -> hex3/6', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          let ps3, ps6;
          const pairs = [r, g, b].map(intToHex);

          const s = "#" + pairs.join('');

          const ms = pairs.map(x => {
            return `${x[0]}${x[0]}`;
          });

          const [mr, mg, mb] = ms;
          ps6 = "#" + ms.join('');
          ps3 = `#${mr[0]}${mg[0]}${mb[0]}`;

          const p1 = S.makeString(T.shortHex(parse(s)));
          const p2 = S.makeString(T.shortHex(parse(ps6)));

          return (p1 === s);
          return (p2 === ps3);

          return true;
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(hex(hex8)) -> hex8', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const s = "#" + [r, g, b, a].map(intToHex).join('');
          const p = S.makeString(T.includeAlpha(parse(s)));

          return (p === s);
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(hex(hex6)) -> hex8', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = "#" + [r, g, b].map(intToHex).join('');
          const s8 = s + 'ff';
          const p = S.makeString(T.includeAlpha(parse(s)));

          return (p.toLowerCase() === s8.toLowerCase());
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(hex(hex4)) -> hex8', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          const [hr, hg, hb, ha] = [r, g, b, a].map(x => {
            const h = intToHex(x);
            return `${h[0]}${h[0]}`;
          });

          const s8 = `#${hr}${hg}${hb}${ha}`;
          const s4 = `#${hr[0]}${hg[0]}${hb[0]}${ha[0]}`;
          const p = S.makeString(T.includeAlpha(parse(s4)));

          return (p.toLowerCase() === s8.toLowerCase());
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(hex(hex3)) -> hex8', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const [hr, hg, hb] = [r, g, b].map(x => {
            const h = intToHex(x);
            return `${h[0]}${h[0]}`;
          });

          const s8 = `#${hr}${hg}${hb}ff`;
          const s3 = `#${hr[0]}${hg[0]}${hb[0]}`;
          const p = S.makeString(T.includeAlpha(parse(s3)));

          return (p.toLowerCase() === s8.toLowerCase());
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(shortHex(hex(hex8))) -> hex4/8', () => {
        let property = jsc.forall(rgbIntQuad, ([r, g, b, a]) => {
          let ps4, ps8;

          let pairs = [r, g, b, a].map(intToHex);

          // Ensure we don't get a random set of pairs
          if (pairs.map(T.checkDoubles).every(x => x)) {
            pairs[0] = 'a3';
          }

          const s = "#" + pairs.join('');

          const ms = pairs.map(x => {
            return `${x[0]}${x[0]}`;
          });

          const [mr, mg, mb, ma] = ms;
          ps8 = "#" + ms.join('');
          ps4 = `#${mr[0]}${mg[0]}${mb[0]}${ma[0]}`;

          const p1 = S.makeString(T.includeAlpha(T.shortHex(parse(s)))); // not pairs
          const p2 = S.makeString(T.includeAlpha(T.shortHex(parse(ps8)))); // pairs

          return (p1 === s);
          return (p2 === ps4);

          return true;
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(shortHex(hex(hex6))) -> hex4/8', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          let ps4, ps8, s8;

          let pairs = [r, g, b].map(intToHex);

          // Ensure we don't get a random set of pairs
          if (pairs.map(T.checkDoubles).every(x => x)) {
            pairs[0] = 'a3';
          }

          const s = "#" + pairs.join(''); // 6 digit hex
          s8 = s + 'ff';

          const ms = pairs.map(x => {
            return `${x[0]}${x[0]}`;
          });

          const [mr, mg, mb] = ms;
          ps8 = "#" + ms.join('') + 'ff';
          ps4 = `#${mr[0]}${mg[0]}${mb[0]}f`;

          const p1 = S.makeString(T.includeAlpha(T.shortHex(parse(s)))); // not pairs
          const p2 = S.makeString(T.includeAlpha(T.shortHex(parse(ps8)))); // pairs

          return (p1 === s8);
          return (p2 === ps4);

          return true;
        });

        jsc.assert(property);
      });

      it('#makeString - format order does not matter', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          let ps4, ps8, s8;

          let pairs = [r, g, b].map(intToHex);

          // Ensure we don't get a random set of pairs
          if (pairs.map(T.checkDoubles).every(x => x)) {
            pairs[0] = 'a3';
          }

          const s = "#" + pairs.join(''); // 6 digit hex
          s8 = s + 'ff';

          const ms = pairs.map(x => {
            return `${x[0]}${x[0]}`;
          });

          const [mr, mg, mb] = ms;
          ps8 = "#" + ms.join('') + 'ff';
          ps4 = `#${mr[0]}${mg[0]}${mb[0]}f`;

          const p1 = S.makeString(T.shortHex(T.includeAlpha(parse(s)))); // not pairs
          const p2 = S.makeString(T.includeAlpha(T.shortHex(parse(ps8)))); // pairs

          return (p1 === s8);
          return (p2 === ps4);

          return true;
        });

        jsc.assert(property);
      });
    });

    describe('RGB', () => {
      it('#makeString rgb(int int int) -> rgb(int int int)', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = `rgb(${r}, ${g}, ${b})`;
          const p = S.makeString(parse(s));
          return (p === s);
        });

        jsc.assert(property);
      });

      it('#makeString rgba(int int int float) -> rgba(int int int float)', () => {
        let property = jsc.forall(rgbaPercentQuad, ([r, g, b, a]) => {
          const s = `rgba(${r}, ${g}, ${b}, ${a / 100})`;
          const p = S.makeString(parse(s));
          return (p === s);
        });

        jsc.assert(property);
      });

      it('#makeString rgba(int int int percent) -> rgba(int int int float)', () => {
        let property = jsc.forall(rgbaPercentQuad, ([r, g, b, a]) => {
          const s = `rgba(${r}, ${g}, ${b}, ${a}%)`;
          const t = `rgba(${r}, ${g}, ${b}, ${a / 100})`;
          const p = S.makeString(parse(s));
          return (p === t);
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(rgb(int int int)) -> rgba(int int int float)', () => {
        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = `rgb(${r}, ${g}, ${b})`;
          const t = `rgba(${r}, ${g}, ${b}, 1)`;
          const p = S.makeString(T.includeAlpha(parse(s)));

          return (p === t);
        });

        jsc.assert(property);
      });

      it('#makeString intToPercent(rgb(int int int)) -> rgb(n% n% n%)', () => {
        const f = (n) => Math.round((n / 255) * 100);

        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = `rgb(${r}, ${g}, ${b})`;
          const t = `rgb(${f(r)}%, ${f(g)}%, ${f(b)}%)`;
          const p = S.makeString(T.intToPercent(parse(s)));

          return (p === t);
        });

        jsc.assert(property);
      });

      it('#makeString includeAlpha(intToPercent(rgb(int int int))) -> rgba(n% n% n% float)', () => {
        const f = (n) => Math.round((n / 255) * 100);

        let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
          const s = `rgb(${r}, ${g}, ${b})`;
          const t = `rgba(${f(r)}%, ${f(g)}%, ${f(b)}%, 1)`;
          const p = S.makeString(T.includeAlpha(T.intToPercent(parse(s))));

          return (p === t);
        });

        jsc.assert(property);
      });
    });
  });
});
