// @flow

import compose from 'ramda/src/compose';
import contains from 'ramda/src/contains';
import curry from 'ramda/src/curry';
import curryN from 'ramda/src/curryN';
import pipe from 'ramda/src/pipe';
import props from 'ramda/src/props';
import uniq from 'ramda/src/uniq';

const PRECISION: number = 2;

/* -- FORMAT TOKENS --*/

export const FORMAT_SHORTHEX = 'shortHex';
export const FORMAT_INCLUDEALPHA = 'alpha';
export const FORMAT_INTTOPERCENT = 'intToPercent';
export const FORMAT_HUETODEGREES = 'hueToDegrees';

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
export function toSafePercent(p: number): number {
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

export function hslToRgb(results: Result): Result {
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

export function rgbToHsl(results: Result): Result {
  const f = c => _rgbToHsl(c);
  return guardResult(f, results);
}

function toHex(n: number): string {
  const x = (n <= 1) ? n : 1;
  const hex = Math.round(x * 255).toString(16);
  return (hex === "0") ? "00" : hex;
}

function checkDoubles(hex: string): boolean {
  const [a, b] = String(hex);
  return a === b;
}

function splitDoubles(hex: string): string {
  const [a] = hex;
  return a;
}
/*
function _rgbToHex(rgb: RGB): HEX {
  const showAlpha = false;
  const {r, g, b, alpha, format} = rgb;
  const pairs = (showAlpha) ?
        [r, g, b, alpha].map(toHex) :
        [r, g, b].map(toHex);

  const hasDoubles = pairs.map(checkDoubles).every(x => x);

  let hexes;
  if (hasDoubles) {
    hexes = pairs.map(splitDoubles);
  } else {
    hexes = pairs;
  }

  const [hr, hg, hb, ha] = hexes;

  return {
    func: 'hex',
    hex: (showAlpha) ? `#${hr}${hg}${hb}${ha}` : `#${hr}${hg}${hb}`,
    r,
    g,
    b,
    alpha,
    format
  };
}
*/

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

export function rgbToHex(results: Result): Result {
  const f = c => _rgbToHex(c);
  return guardResult(f, results);
}

export function hslToHex(results: Result): Result {
  const fs = compose(_rgbToHex, _hslToRgb);
  return guardResult(fs, results);
}


/* --- FORMATS --- */


function addFormat(fmt: string, format: Array<string>): Array<string> {
  return uniq([...format, fmt]);
}

function formatFactory(fmt: string): Function {
  return function(result: ColorObject): Result {
    const {format} = result;
    result.format = addFormat(fmt, format);
    return result;
  }
}

export const shortHex: Function = formatFactory(FORMAT_SHORTHEX);
export const includeAlpha: Function = formatFactory(FORMAT_INCLUDEALPHA);
export const intToPercent: Function = formatFactory(FORMAT_INTTOPERCENT);
export const hueToDegrees: Function = formatFactory(FORMAT_HUETODEGREES);


/**
 * Extract keys from Disjoint ColorObject
 */
function getValue(func: string, keys: Array<string>, color: ColorObject): Array<any> {
  return (color.func === func) ? props(keys, color) : [];
};

/* --- STRING --- */

const hasAlpha = contains(FORMAT_INCLUDEALPHA);
const hasHueToDegress = contains(FORMAT_HUETODEGREES);
const hasIntToPercent = contains(FORMAT_INTTOPERCENT);
const hasShortHex = contains(FORMAT_SHORTHEX);

const getRgbVals: Function =
      curryN(3, getValue)('rgb', ['r', 'g', 'b', 'alpha', 'format']);

function floatToPercent(n: number): string {
  let x = (n > 1) ? 1 : n;
  return `${x * 100}%`;
}

/**
 * Convert a float [0,1] to an int [0,255]
 */
function percentToInt(n: number): number {
  if (!n) return 0;
  return linearTransformFactory(0, 1, 0, 255)(n);
}

/**
 * RGB/RGBA -> String
 */
function makeRgbString(color: ColorObject): string {
  const keys = ['func', 'r', 'g', 'b', 'alpha', 'format'];
  let props = [];

  if (color.func === 'rgb') {
    props = getValue('rgb', keys, color);
  }

  if (color.func === 'rgba') {
    props = getValue('rgba', keys, color);
  }

  const [func, r, g, b, alpha, format] = props;
  let rgb: Array<any> = [r, g, b];

  if (hasIntToPercent(format)) {
    rgb = rgb.map(floatToPercent); // [0, 1] -> n%
  } else {
    rgb = rgb.map(percentToInt); // [0, 1] -> [0, 255]
  }

  const [nr, ng, nb] = rgb;

  if (hasAlpha(format) || func === 'rgba') {
    return `rgba(${nr}, ${ng}, ${nb}, ${alpha})`;
  }

  return `rgb(${nr}, ${ng}, ${nb})`;
}

export function makeString(result: ColorObject): string {
  const {func} = result;

  switch (func) {
    case 'rgb':
    case 'rgba':
      return makeRgbString(result);
    default:
      return '#error - could not output string for this color object';
  }
};
