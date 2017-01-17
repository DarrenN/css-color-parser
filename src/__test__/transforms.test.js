/*global describe, it */

import expect from 'expect';
import parse from '../CssParser';
import * as T from '../Transforms';
import jsc from 'jsverify';
import * as _ from 'lodash/fp';

function convertInt(x) {
  if (x > 1) {
    return T.toSafePercent(x / 255);
  }
  return x;
}

const rgbIntTriplet = jsc.tuple([
  jsc.integer(0, 255),
  jsc.integer(0, 255),
  jsc.integer(0, 255)
]);

const hslIntTriplet = jsc.tuple([
  jsc.integer(1, 360),
  jsc.integer(0, 100),
  jsc.integer(0, 100)
]);

function createHslTriplet(t) {
  const [h, s, l] = t;
  return [h, s + "%", l + "%"];
}

describe('Transforms', () => {
  describe('conversions', () => {

    it('RGB -> HSL', () => {
      let property = jsc.forall(rgbIntTriplet, (arr) => {
        const [r, g, b] = arr.map(convertInt);
        const s = `rgb(${r}, ${g}, ${b})`;
        const hsl = T.rgbToHsl(parse(s));
        return (hsl.status === 'done');
      });

      jsc.assert(property);
    });

    it('Parses rgb(Int, Int, Int)', () => {
      let property = jsc.forall(rgbIntTriplet, ([r, g, b]) => {
        const s = `rgb(${r}, ${g}, ${b})`;
        const p = parse(s);
        return (p && p.status && p.status === 'done');
      });

      jsc.assert(property);
    });

    it('Parses rgb(Float, Float, Float)', () => {
      let property = jsc.forall(rgbIntTriplet, (arr) => {
        const [r, g, b] = arr.map(convertInt);
        const s = `rgb(${r}, ${g}, ${b})`;
        const p = parse(s);
        return (p && p.status && p.status === 'done');
      });

      jsc.assert(property);
    });
  });
});
