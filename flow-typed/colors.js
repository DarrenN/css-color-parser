// @flow

declare type RGBA = {
  r: number,
  g: number,
  b: number,
  alpha: number
};

declare type HSLA = {
  h: number,
  s: number,
  l: number,
  alpha: number
};

declare type HWB = {
  h: number,
  w: number,
  b: number,
  alpha: number
};

declare type LAB = {
  l: number,
  a: number,
  b: number,
  alpha: number
};

declare type LCH = {
  l: number,
  c: number,
  h: number,
  alpha: number
};

declare type CMYK = {
  c: number,
  m: number,
  y: number,
  k: number,
  alpha: number
};

declare type GRAY = {
  l: number,
  alpha: number
}

declare type ColorObject = RGBA | HSLA | HWB | LAB | LCH | CMYK | GRAY
