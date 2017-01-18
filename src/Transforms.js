import compose from 'lodash/fp/compose';
import curry from 'lodash/fp/curry';

const PRECISION: number = 2;

/**
 * Take Parsed types and map the transform over result, returning Result
 * Immediately short circuit ParsedError type.
 *
 * @param {Function} func - transform function
 * @param {Result} results
 * @return {Result}
 */
function processResults(func: Function, results: Result): Result {
  switch (results.status) {
    case 'error':
      return result;
    case 'done': {
      const {result} = results;
      const ps = result.map(func);
      return {
        status: 'done',
        result: ps
      };
    }
  }
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
function _hslToRgb(func: string, color: HSLA): RGBA {
  let {h, s, l, alpha} = color;
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

  return {func, r, g, b, alpha};
}

export function hslToRgb(results: Result): Result {
  const f = c => _hslToRgb('rgb', c);
  return processResults(f, results);
}

export function hslToRgba(results: Result): Result {
  const f = c => _hslToRgb('rgba', c);
  return processResults(f, results);
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
  r = convertRGBValue(r);
  g = convertRGBValue(g);
  b = convertRGBValue(b);

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  var d = max - min;

  if (d === 0 || max === min) {
    h = s = 0; // achromatic
  } else {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let dr = (((max - r) / 6) + (max / 2)) / max;
    let dg = (((max - g) / 6) + (max / 2)) / max;
    let db = (((max - b) / 6) + (max / 2)) / max;

    if (r === max) {
      h = db - dg;
    } else if (g === max) {
      h = ( 1 / 3 ) + dr - db;
    } else if (b === max) {
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
}

function _rgbToHsl(func: string, color: RGBA): HSLA {
  const {r, g, b, alpha} = color;
  const [h, s, l] = _calcRgbToHsl(r, g, b);
  return {func, h, s, l, alpha};
}

export function rgbToHsl(results: Result): Result {
  const f = c => _rgbToHsl('hsl', c);
  return processResults(f, results);
}

export function rgbToHsla(results: Result): Result {
  const f = c => _rgbToHsl('hsla', c);
  return processResults(f, results);
}

export function rgbaToHsl(results: Result): Result {
  return rgbaToHsl(results);
}

export function rgbaToHsla(results: Result): Result {
  return rgbaToHsl(results);
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

function _rgbToHex(func: string, showAlpha = false, rgb: RGBA): HEX {
  const {r, g, b, alpha} = rgb;
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
    func,
    hex: (showAlpha) ? `#${hr}${hg}${hb}${ha}` : `#${hr}${hg}${hb}`
  };
}

export function rgbToHex(results: Result): Result {
  const f = c => _rgbToHex('hex', false, c);
  return processResults(f, results);
}

export function rgbaToHex(results: Result): Result {
  const f = c => _rgbToHex('hex', true, c);
  return processResults(f, results);
}

export function hslToHex(results: Result): Result {
  const fs = compose(curry(_rgbToHex)('hex')(false),
                     curry(_hslToRgb)('hsl'));
  const f = c => fs(c);
  return processResults(f, results);
}

export function hslaToHex(results: Result): Result {
  const fs = compose(curry(_rgbToHex)('hex')(true),
                     curry(_hslToRgb)('hsla'));
  const f = c => fs(c);
  return processResults(f, results);
}

function _toString(opts = {}, color: ColorObject): string {
  const {func} = color;
  switch (func) {
    case 'hex': {
      const {hex} = color;
      return hex;
    }
  }
}

export function toString(opts = {}, results: Result): Result {
  const f = c => _toString(opts, c);
  return processResults(f, results);
}
