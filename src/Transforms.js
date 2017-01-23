// @flow
import math from 'mathjs';

import clone from 'ramda/src/clone';
import compose from 'ramda/src/compose';
import pipe from 'ramda/src/pipe';
import uniq from 'ramda/src/uniq';

const PRECISION: number = 2;

/* -- FORMAT TOKENS --*/

const FORMAT_HUETODEGREES = 'hueToDegrees';
const FORMAT_INCLUDEALPHA = 'alpha';
const FORMAT_INTTOPERCENT = 'intToPercent';
const FORMAT_SHORTHEX = 'shortHex';

// Polyfil for Math.cbrt
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt
if (!Math.cbrt) {
  Math.cbrt = function(x) {
    var y = Math.pow(Math.abs(x), 1/3);
    return x < 0 ? -y : y;
  };
}

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

/**
 * HSL -> RGB
 */
function hslToRgb(results: Result): Result {
  const f = c => _hslToRgb(c);
  return guardResult(f, results);
}

/**
 * HSL -> RGB -> HEX
 */
function hslToHex(results: Result): Result {
  const fs = compose(_rgbToHex, _hslToRgb);
  return guardResult(fs, results);
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

/**
 * RGB -> HEX
 */
function rgbToHex(results: Result): Result {
  const f = c => _rgbToHex(c);
  return guardResult(f, results);
}

/* --- LAB / LCH --- */

function rgbToLinearLight(n: number): number {
  if (n < 0.04045) {
    return n / 12.92;
  }

  return Math.pow((n + 0.055) / 1.055, 2.4);
}

function D65_to_D50(XYZ: Array<number>): Array<number> {
  // Bradford chromatic adaptation from D65 to D50
  // The matrix below is the result of three operations:
  // - convert from XYZ to retinal cone domain
  // - scale components from one reference white to another
  // - convert back to XYZ
  // http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
  const M = math.matrix([
    [ 1.0478112, 0.0228866, -0.0501270],
    [ 0.0295424, 0.9904844, -0.0170491],
    [-0.0092345, 0.0150436, 0.7521316]
  ]);

  return math.multiply(M, XYZ).valueOf();
};

function D50_to_D65(XYZ) {
  // Bradford chromatic adaptation from D50 to D65
  const M = math.matrix([
    [ 0.9555766, -0.0230393, 0.0631636],
    [-0.0282895, 1.0099416, 0.0210077],
    [ 0.0122982, -0.0204830, 1.3299098]
  ]);

  return math.multiply(M, XYZ).valueOf();
}

function RGB_to_XYZ(rgb: Array<number>): Array<number> {
  let nrgb = rgb.map(rgbToLinearLight);
  const M = math.matrix([
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
  ]);

  return math.multiply(M, nrgb).valueOf();
};

function XYZ_to_lin_sRGB(XYZ: Array<number>): Array<number> {
  // convert XYZ to linear-light sRGB
  const M = math.matrix([
    [ 3.2404542, -1.5371385, -0.4985314],
    [-0.9692660, 1.8760108, 0.0415560],
    [ 0.0556434, -0.2040259, 1.0572252]
  ]);

  return math.multiply(M, XYZ).valueOf();
};

function gam_sRGB(RGB: Array<number>): Array<number> {
  // convert an array of linear-light sRGB values in the range 0.0-1.0
  // to gamma corrected form
  // https://en.wikipedia.org/wiki/SRGB

  return RGB.map(function (val) {
    if (val > 0.0031308) {
      return 1.055 * Math.pow(val, 1/2.4) - 0.055;
    }

    return 12.92 * val;
  });
};

function XYZ_to_LAB(XYZ: Array<number>): Array<number> {
  // Assuming XYZ is relative to D50, convert to CIE Lab
  // from CIE standard, which now defines these as a rational fraction
  const e = 216/24389;  // 6^3/29^3
  const k = 24389/27;   // 29^3/3^3
  const white = [0.9642, 1.0000, 0.8249]; // D50 reference white

  // compute xyz, which is XYZ scaled relative to reference white
  const xyz = XYZ.map((value, i) => value / white[i]);

  // now compute f
  const f = xyz.map(value => value > e ? Math.cbrt(value) : (k * value + 16)/116);

  return [
    (116 * f[1]) - 16, // L
    500 * (f[0] - f[1]), // a
    200 * (f[1] - f[2]) // b
  ];
};

function Lab_to_XYZ(Lab: Array<number>): Array<number> {
  // Convert Lab to D50-adapted XYZ
  const k = 24389/27;   // 29^3/3^3
  const e = 216/24389;  // 6^3/29^3
  const white = [0.9642, 1.0000, 0.8249]; // D50 reference white
  let f = [];

  // compute f, starting with the luminance-related term
  f[1] = (Lab[0] + 16)/116;
  f[0] = Lab[1]/500 + f[1];
  f[2] = f[1] - Lab[2]/200;

  // compute xyz
  var xyz = [
    Math.pow(f[0],3) > e ? Math.pow(f[0],3) : (116*f[0]-16)/k,
    Lab[0] > k * e ? Math.pow((Lab[0]+16)/116,3) : Lab[0]/k,
    Math.pow(f[2],3) > e ? Math.pow(f[2],3) : (116*f[2]-16)/k
  ];

  // Compute XYZ by scaling xyz by reference white
  return xyz.map((value, i) => value * white[i]);
}

function _rgbToLab(rgb: RGB): LAB {
  const {r, g, b, format, alpha} = rgb;
  /*
    Convert from sRGB to linear-light sRGB (undo gamma correction)
    Convert from linear sRGB to CIE XYZ
    Convert from a D65 whitepoint (used by sRGB) to the D50 whitepoint used
    in Lab, with the Bradford transform
    Convert D50-adapted XYZ to Lab
  */
  const CIE_XYZ = RGB_to_XYZ([r, g, b]);
  const XYZ = D65_to_D50(CIE_XYZ);
  const LAB = XYZ_to_LAB(XYZ);

  return {
    func: 'lab',
    format,
    alpha,
    l: LAB[0],
    a: LAB[1],
    b: LAB[2]
  };
}

function _labToRgb(lab: LAB): RGB {
  /*
    Convert Lab to (D50-adapted) XYZ
    Convert from a D50 whitepoint (used by Lab) to the D65 whitepoint used
    in sRGB, with the Bradford transform
    Convert from (D65-adapted) CIE XYZ to linear sRGB
    Convert from linear-light sRGB to sRGB (do gamma correction)
  */
  const {l, a, b, format, alpha} = lab;
  const rgb = pipe(Lab_to_XYZ,
                   D50_to_D65,
                   XYZ_to_lin_sRGB,
                   gam_sRGB)([l, a, b]);

  return {
    func: 'rgb',
    format,
    alpha,
    r: rgb[0],
    g: rgb[1],
    b: rgb[2]
  };
};

/**
 * LAB -> RGB
 */
function labToRgb(results: Result): Result {
  const f = c => _labToRgb(c);
  return guardResult(f, results);
}

/**
 * RGB -> LAB
 */
function rgbToLab(results: Result): Result {
  const f = c => _rgbToLab(c);
  return guardResult(f, results);
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
  checkDoubles,
  hslToHex,
  hslToRgb,
  hueToDegrees,
  includeAlpha,
  intToPercent,
  labToRgb,
  linearTransformFactory,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  shortHex,
  splitDoubles,
  toHex,
  toSafePercent
};
