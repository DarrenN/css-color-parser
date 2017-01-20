// @flow

import clone from 'ramda/src/clone';
import compose from 'ramda/src/compose';
import uniq from 'ramda/src/uniq';

const PRECISION: number = 2;

/* -- FORMAT TOKENS --*/

const FORMAT_HUETODEGREES = 'hueToDegrees';
const FORMAT_INCLUDEALPHA = 'alpha';
const FORMAT_INTTOPERCENT = 'intToPercent';
const FORMAT_SHORTHEX = 'shortHex';

function linearTransformFactory(omin: number, omax: number, nmin: number, nmax: number): Function {
  return (n: number) => {
    let orange = (omax - omin);
		let nrange = (nmax - nmin);
		return Math.round((((n - omin) * nrange) / orange) + nmin);
  };
}

/**
 * Take Parsed types and map the transform over result, returning Result
 * Immediately short circuit ParsedError type.
 *
 * @param {Function} func - transform function
 * @param {Result} result
 * @return {Result}
 */
function guardResult(func: Function, result: Result): Result {
  if (result && result.status) {
    return result;
  }

  return func(result);
}

/**
 * Constrain floats to PRECISION decimal places
 * @param {Number} p
 * @return {Number}
 */
function toSafePercent(p: number): number {
  return Number(p.toFixed(PRECISION));
}

function convertRGBValue(n: number): number {
  return (n > 1) ? n / 255 : n;
}

/* --- HSL --- */

// http://www.easyrgb.com/index.php?X=MATH&H=19#text19
function _hueToRgb(t1: number, t2: number, hue: number): number {
  if (hue < 0) hue += 1;
  if (hue > 1) hue -= 1;

  if ( (6 * hue) < 1 ) { return (t1 + (t2 - t1) * 6 * hue); }
  if ( (2 * hue) < 1 ) { return t2; }
  if ( (3 * hue) < 2 ) { return (t1 + (t2 - t1) * ((2 / 3) - hue) * 6); }
  return t1;
}

// http://www.easyrgb.com/index.php?X=MATH&H=19#text19
function _hslToRgb(color: HSL): RGB {
  let {h, s, l, alpha, format} = color;
  let r: number, g: number, b: number, t2: number, t1: number;

  if (h > 1) { h = h / 360; }; // convert to percent

  if (s === 0) {
    r = g = b = l * 255;
  } else {

    if (l <= .5 ) {
      t2 = l * (s + 1);
    } else {
      t2 = l + s - (l * s);
    }

    t1 = l * 2 - t2;
    r = toSafePercent(_hueToRgb(t1, t2, h + (1 / 3)));
    g = toSafePercent(_hueToRgb(t1, t2, h));
    b = toSafePercent(_hueToRgb(t1, t2, h - (1 / 3)));
  }

  return {func: 'rgb', r, g, b, alpha, format};
}

function hslToRgb(results: Result): Result {
  const f = c => _hslToRgb(c);
  return guardResult(f, results);
}


/* --- RGB --- */

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 1] and
 * returns h, s, and l in the set [0, 1].
 *
 * Used this formula: http://www.easyrgb.com/index.php?X=MATH&H=19#text19
 *
 * @param {number} r  The red color value
 * @param {number} g  The green color value
 * @param {number} b  The blue color value
 * @return {Array<number>}
 */
function _calcRgbToHsl(r: number, g: number, b: number): Array<number> {
  // Just in case the r/g/b are somehow in [0, 255]
  let tr: number = convertRGBValue(r);
  let tg: number = convertRGBValue(g);
  let tb: number = convertRGBValue(b);

  let max: number = 0;
  let min: number = 0;
  let d: number = 0;
  let h: number = 0;
  let s: number = 0;
  let l: number = 0;

  let dr: number;
  let dg: number;
  let db: number;

  max = Math.max(tr, tg, tb), min = Math.min(tr, tg, tb);
  h, s, l = (max + min) / 2;
  d = max - min;

  if (d === 0 || max === min) {
    h = s = 0; // achromatic
  } else {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    dr = (((max - tr) / 6) + (max / 2)) / max;
    dg = (((max - tg) / 6) + (max / 2)) / max;
    db = (((max - tb) / 6) + (max / 2)) / max;

    if (tr === max) {
      h = db - dg;
    } else if (tg === max) {
      h = ( 1 / 3 ) + dr - db;
    } else if (tb === max) {
      h = ( 2 / 3 ) + dg - dr;
    }

    if (h < 0) { h += 1; }
    if (h > 1) { h -= 1; }
  }

  return [
    toSafePercent(h),
    toSafePercent(s),
    toSafePercent(l)
  ];
};

function _rgbToHsl(color: RGB): HSL {
  const {r, g, b, alpha, format} = color;
  const [h, s, l] = _calcRgbToHsl(r, g, b);
  return {func: 'hsl', h, s, l, alpha, format};
}

function rgbToHsl(results: Result): Result {
  const f = c => _rgbToHsl(c);
  return guardResult(f, results);
}

/**
 * Convert [0, 1] to Hex pair
 *
 * @param {Number} n [0, 1]
 * @return {String}
 */
function toHex(x: number): string {
  let out = "";
  let n = (x <= 1) ? x : 1; // constrain to [0, 1]
  n = n * 255; // convert to [0, 255]

  n = parseInt(n,10);
  if (isNaN(n)) return "00";

  n = Math.max(0, Math.min(n,255));

  out = "0123456789ABCDEF".charAt((n - n % 16) / 16)
    + "0123456789ABCDEF".charAt(n % 16);

  return out.toLocaleLowerCase();
}

function checkDoubles(hex: string): boolean {
  const h = String(hex);
  return h[0] === h[1];
}

function splitDoubles(hex: string): string {
  const h = String(hex);
  return h[0];
}

function _rgbToHex(rgb: RGB): HEX {
  const {r, g, b, alpha, format} = rgb;
  const pairs = [r, g, b].map(toHex);
  const [hr, hg, hb] = pairs;

  return {
    func: 'hex',
    hex: `#${hr}${hg}${hb}`,
    r,
    g,
    b,
    alpha,
    format
  };
}

function rgbToHex(results: Result): Result {
  const f = c => _rgbToHex(c);
  return guardResult(f, results);
}

function hslToHex(results: Result): Result {
  const fs = compose(_rgbToHex, _hslToRgb);
  return guardResult(fs, results);
}


/* --- FORMATS --- */

/**
 * Ensure values added to format are unique
 *
 * @param {String} fmt string to add
 * @param {Array<string>} format array to add to
 * @return {Array<string>}
 */
function addFormat(fmt: string, format: Array<string>): Array<string> {
  return (Array.isArray(format)) ? uniq([...format, fmt]) : format;
};

/**
 * Create functions that manipulate the format property in Result
 * Note: We take care not to mutate the original object (using clone)
 *
 * @param {String} fmt string to add to format array
 * @return {Function}
 */
function formatFactory(fmt: string): Function {
  return function(result: ColorObject): Result {
    const r = clone(result);
    const {format} = r;
    r.format = addFormat(fmt, format);
    return r;
  }
}

const shortHex: Function = formatFactory(FORMAT_SHORTHEX);
const includeAlpha: Function = formatFactory(FORMAT_INCLUDEALPHA);
const intToPercent: Function = formatFactory(FORMAT_INTTOPERCENT);
const hueToDegrees: Function = formatFactory(FORMAT_HUETODEGREES);

export {
  FORMAT_HUETODEGREES,
  FORMAT_INCLUDEALPHA,
  FORMAT_INTTOPERCENT,
  FORMAT_SHORTHEX,
  hslToHex,
  hslToRgb,
  hueToDegrees,
  includeAlpha,
  intToPercent,
  linearTransformFactory,
  rgbToHex,
  rgbToHsl,
  shortHex,
  toHex,
  toSafePercent,
  checkDoubles,
  splitDoubles
};
