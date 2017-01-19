// @flow

import compose from 'ramda/src/compose';
import contains from 'ramda/src/contains';
import curry from 'ramda/src/curry';
import curryN from 'ramda/src/curryN';
import pipe from 'ramda/src/pipe';
import props from 'ramda/src/props';
import uniq from 'ramda/src/uniq';

import {
  FORMAT_HUETODEGREES,
  FORMAT_INCLUDEALPHA,
  FORMAT_INTTOPERCENT,
  FORMAT_SHORTHEX,
  linearTransformFactory,
  toHex,
  splitDoubles,
  checkDoubles
} from './Transforms';


/* --- STRING --- */

const hasAlpha = contains(FORMAT_INCLUDEALPHA);
const hasHueToDegress = contains(FORMAT_HUETODEGREES);
const hasIntToPercent = contains(FORMAT_INTTOPERCENT);
const hasShortHex = contains(FORMAT_SHORTHEX);


/**
 * Extract keys from Disjoint ColorObject
 */
function getValue(func: string, keys: Array<string>, color: ColorObject): Array<any> {
  return (color.func === func) ? props(keys, color) : [];
};


const getRgbVals: Function =
      curryN(3, getValue)('rgb', ['r', 'g', 'b', 'alpha', 'format']);

function floatToPercent(n: number): string {
  let x = (n > 1) ? 1 : n;
  return `${Math.round(x * 100)}%`;
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


/**
 * HEX -> String
 */
function makeHexString(color: ColorObject): string {
  const keys = ['func', 'hex', 'r', 'g', 'b', 'alpha', 'format'];
  let props = [];

  if (color.func === 'hex') {
    props = getValue('hex', keys, color);
  }

  const [, hex, r, g, b, alpha, format] = props;

  let out = hex; // operate on a copy
  let pairs = []; // store modified channels

  // No changes to format and 6/8 long then short circuit using
  // the stored hex string. ALSO, account for the '#'!!
  if (!format.length && hex.length >= 7) {
    if (hex.length === 7) {
      return out;
    }

    // Lop off alpha hex
    if (hex.length === 9) {
      return out.substr(0, 7);
    }
  }

  // If we're not shortening and the hex string is short,
  // then expand it back out (ex: parse(#039f))
  if (!hasShortHex(format) && hex.length <= 7) {
    if (hasAlpha(format)) {
      pairs = [r, g, b, alpha].map(toHex);
      out = "#" + pairs.join('');
    } else {
      pairs = [r, g, b].map(toHex);
      out = "#" + pairs.join('');
    }
  }

  // We can only shorten if all pairs are doubles
  if (hasShortHex(format)) {
    if (hasAlpha(format)) {
      pairs = [r, g, b, alpha].map(toHex);
    } else {
      pairs = [r, g, b].map(toHex);
    }

    const hasDoubles = pairs.map(checkDoubles).every(x => x);

    if (hasDoubles) {
      out = "#" + pairs.map(splitDoubles).join('');
    } else {
      out = "#" + pairs.join(''); // no alpha and no doubles so just 6
    }
  }

  return out;
}

function makeString(result: ColorObject): string {
  const {func} = result;

  switch (func) {
    case 'hex':
      return makeHexString(result);
    case 'rgb':
    case 'rgba':
      return makeRgbString(result);
    default:
      return '#error - could not output string for this color object';
  }
};

export {
  makeString
};
