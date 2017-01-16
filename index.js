/* @flow */

import Parser from './src/parser.js';

const trgb: string = `hsla(128, 63%, 23%, 100)`;

type RGBA = {
  r: number,
  g: number,
  b: number,
  alpha: number
};

type HSLA = {
  h: number,
  s: number,
  l: number,
  alpha: number
};

type HWB = {
  h: number,
  w: number,
  b: number,
  alpha: number
};

type LAB = {
  l: number,
  a: number,
  b: number,
  alpha: number
};

type LCH = {
  l: number,
  c: number,
  h: number,
  alpha: number
};

type CMYK = {
  c: number,
  m: number,
  y: number,
  k: number,
  alpha: number
};

type GRAY = {
  l: number,
  alpha: number
}


class Color {
  cmyk: CMYK;
  gray: GRAY;
  hsla: HSLA;
  hwb: HWB;
  lab: LAB;
  lch: LCH;
  rgba: RGBA;
  hex: string;

  constructor(funcType: string, color: Object): void {
    switch (funcType) {
      case "device-cmyk":
        this.cmyk = this.generateRgb(color, funcType);
        break;
      case "gray":
        this.gray = this.generateRgb(color, funcType);
        break;
      case "hsl":
      case "hsla":
        this.hsla = this.generateRgb(color, funcType);
        break;
      case "hwb":
        this.hwb = this.generateRgb(color, funcType);
        break;
      case "lab":
        this.lab = this.generateRgb(color, funcType);
        break;
      case "lch":
        this.lch = this.generateRgb(color, funcType);
        break;
      case "rgb":
      case "rgba":
        this.rgba = color;
        break;
      default:
        new Error(`Could not parse this color: ${funcType}`);
    }
  }

  toSafePercent(p: number): number {
    return parseFloat(p.toPrecision(2));
  }

  getHsla(): HSLA {
    if (!this.hsla) {
      return this.generateHsla();
    }
    return this.hsla;
  }

  generateRgb(color: Object, type: string): Object {
    switch (type) {
      case "hsl":
      case "hsla":
        this.rgba = this.hslToRgb(color);
        return color;

      default:
        return color;
    }
  }

  generateHsla(): HSLA {
    return {h: 0, s: 0, l: 0, alpha: 0};
  }

  hueToRgb(t1: number, t2: number, hue: number) {
    if(hue < 0) hue += 6;
    if(hue >= 6) hue -= 6;

    if(hue < 1) return (t2 - t1) * hue + t1;
    else if(hue < 3) return t2;
    else if(hue < 4) return (t2 - t1) * (4 - hue) + t1;
    else return t1;
  }

  hslToRgb(color: Object): RGBA {
    let {h, s, l, alpha} = color;
    let r: number, g: number, b: number, t2: number, t1: number;

    if (h > 1) { h = h / 360 }; // convert to percent

    if (l <= .5 ) {
      t2 = l * (s + 1);
    } else {
      t2 = l + s - (l * s);
    }

    t1 = l * 2 - t2;
    r = this.toSafePercent(this.hueToRgb(t1, t2, h + 2));
    g = this.toSafePercent(this.hueToRgb(t1, t2, h));
    b = this.toSafePercent(this.hueToRgb(t1, t2, h - 2));

    return {r, g, b, alpha};
  }

}

function parse(str: string): any {
  try {
    const parsed: Array<Object> = Parser.parse(str);
    if (parsed.length) {
      const ps = parsed.map((color: Object) => {
        const [key: string] = Object.keys(color);
        if (key) {
          return new Color(key, color[key]);
        }
      });

      if (ps.length && ps.length === 1) {
        return ps[0];
      } else {
        return ps;
      }
    }
  } catch(e) {
    throw new Error(e);
  }
}

let x = parse(trgb);
console.log(x);
