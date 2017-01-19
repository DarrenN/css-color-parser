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
  linearTransformFactory
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

function makeString(result: ColorObject): string {
  const {func} = result;

  switch (func) {
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
