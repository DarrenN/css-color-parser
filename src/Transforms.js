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
      console.log(result);
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
function toSafePercent(p: number): number {
  return parseFloat(p.toPrecision(PRECISION));
}


function _hueToRgb(t1: number, t2: number, hue: number) {
  if(hue < 0) hue += 6;
  if(hue >= 6) hue -= 6;

  if(hue < 1) return (t2 - t1) * hue + t1;
  else if(hue < 3) return t2;
  else if(hue < 4) return (t2 - t1) * (4 - hue) + t1;
  else return t1;
}

function _hslToRgb(func: string, color: HSLA): RGBA {
  let {h, s, l, alpha} = color;
  let r: number, g: number, b: number, t2: number, t1: number;

  if (h > 1) { h = h / 360 }; // convert to percent

  if (l <= .5 ) {
    t2 = l * (s + 1);
  } else {
    t2 = l + s - (l * s);
  }

  t1 = l * 2 - t2;
  r = toSafePercent(_hueToRgb(t1, t2, h + 2));
  g = toSafePercent(_hueToRgb(t1, t2, h));
  b = toSafePercent(_hueToRgb(t1, t2, h - 2));

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
