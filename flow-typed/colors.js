// @flow

declare type RGB = {
  func: 'rgb',
  format: Array<string>,
  r: number,
  g: number,
  b: number,
  alpha: number
};

declare type HSL = {
  func: 'hsl',
  format: Array<string>,
  h: number,
  s: number,
  l: number,
  alpha: number
};

declare type HWB = {
  func: 'hwb',
  format: Array<string>,
  h: number,
  w: number,
  b: number,
  alpha: number
};

declare type LAB = {
  func: 'lab',
  format: Array<string>,
  l: number,
  a: number,
  b: number,
  alpha: number
};

declare type LCH = {
  func: 'lch',
  format: Array<string>,
  l: number,
  c: number,
  h: number,
  alpha: number
};

declare type CMYK = {
  func: 'device-cmyk',
  format: Array<string>,
  c: number,
  m: number,
  y: number,
  k: number,
  alpha: number
};

declare type GRAY = {
  func: 'gray',
  format: Array<string>,
  l: number,
  alpha: number
};

declare type HEX = {
  func: 'hex',
  format: Array<string>,
  r: number,
  g: number,
  b: number,
  alpha: number
};

declare type ColorObject
  = RGB
  | CMYK
  | GRAY
  | HEX
  | HSL
  | HWB
  | LAB
  | LCH;
