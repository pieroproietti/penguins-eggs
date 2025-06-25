// @ts-nocheck
/**
 * sprintf.ts
 *
 * Converted to a TypeScript module to ensure consistent compilation.
 * The @ts-nocheck directive tells the compiler to trust the code inside,
 * even though it uses older JavaScript patterns.
 */
// NOTA BENE: La firma della funzione è cambiata in `...args: any[]`.
// Questo dice a TypeScript che la funzione accetta un numero variabile
// di argomenti, risolvendo l'errore "Expected 0 arguments".
function sprintf(...args: any[]) {
  // Return a formatted string
  //
  // version: 1107.2516
  // discuss at: http://phpjs.org/functions/sprintf
  var regex =
    /%%|%(\d+\$)?([\-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g;
  var a = arguments,
    i = 0,
    format = a[i++];

  // pad()
  var pad = function (str, len, chr, leftJustify) {
    if (!chr) {
      chr = " ";
    }
    var padding =
      str.length >= len ? "" : Array((1 + len - str.length) >>> 0).join(chr);
    return leftJustify ? str + padding : padding + str;
  };

  // justify()
  var justify = function (
    value,
    prefix,
    leftJustify,
    minWidth,
    zeroPad,
    customPadChar,
  ) {
    var diff = minWidth - value.length;
    if (diff > 0) {
      if (leftJustify || !zeroPad) {
        value = pad(value, minWidth, customPadChar, leftJustify);
      } else {
        value =
          value.slice(0, prefix.length) +
          pad("", diff, "0", true) +
          value.slice(prefix.length);
      }
    }
    return value;
  };
  // formatBaseX()
  var formatBaseX = function (
    value,
    base,
    prefix,
    leftJustify,
    minWidth,
    precision,
    zeroPad,
  ) {
    // Note: casts negative numbers to positive ones
    var number = value >>> 0;
    prefix =
      (prefix &&
        number &&
        {
          2: "0b",
          8: "0",
          16: "0x",
        }[base]) ||
      "";
    value = prefix + pad(number.toString(base), precision || 0, "0", false);
    return justify(value, prefix, leftJustify, minWidth, zeroPad);
  };

  // formatString()
  var formatString = function (
    value,
    leftJustify,
    minWidth,
    precision,
    zeroPad,
    customPadChar,
  ) {
    if (precision !== null) {
      value = value.slice(0, precision);
    }
    return justify(value, "", leftJustify, minWidth, zeroPad, customPadChar);
  };

  // doFormat()
  var doFormat = function (
    substring,
    valueIndex,
    flags,
    minWidth,
    _,
    precision,
    type,
  ) {
    var number;
    var prefix;
    var method;
    var textTransform;
    var value;
    if (substring == "%%") {
      return "%";
    }

    // parse flags
    var leftJustify = false,
      positivePrefix = "",
      zeroPad = false,
      prefixBaseX = false,
      customPadChar = " ";
    var flagsl = flags.length;
    for (var j = 0; flags && j < flagsl; j++) {
      switch (flags.charAt(j)) {
        case " ":
          positivePrefix = " ";
          break;
        case "+":
          positivePrefix = "+";
          break;
        case "-":
          leftJustify = true;
          break;
        case "'":
          customPadChar = flags.charAt(j + 1);
          break;
        case "0":
          zeroPad = true;
          break;
        case "#":
          prefixBaseX = true;
          break;
      }
    }

    // parameters may be null, undefined, empty-string or real valued
    // we want to ignore null, undefined and empty-string values
    if (!minWidth) {
      minWidth = 0;
    } else if (minWidth == "*") {
      minWidth = +a[i++];
    } else if (minWidth.charAt(0) == "*") {
      minWidth = +a[minWidth.slice(1, -1)];
    } else {
      minWidth = +minWidth;
    }
    // Note: undocumented perl feature:
    if (minWidth < 0) {
      minWidth = -minWidth;
      leftJustify = true;
    }

    if (!isFinite(minWidth)) {
      throw new Error("sprintf: (minimum-)width must be finite");
    }
    if (!precision) {
      precision = "fFeE".indexOf(type) > -1 ? 6 : type == "d" ? 0 : undefined;
    } else if (precision == "*") {
      precision = +a[i++];
    } else if (precision.charAt(0) == "*") {
      precision = +a[precision.slice(1, -1)];
    } else {
      precision = +precision;
    }
    // grab value using valueIndex if required?
    value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

    switch (type) {
      case "s":
        return formatString(
          String(value),
          leftJustify,
          minWidth,
          precision,
          zeroPad,
          customPadChar,
        );
      case "c":
        return formatString(
          String.fromCharCode(+value),
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        );
      case "b":
        return formatBaseX(
          value,
          2,
          prefixBaseX,
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        );
      case "o":
        return formatBaseX(
          value,
          8,
          prefixBaseX,
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        );
      case "x":
        return formatBaseX(
          value,
          16,
          prefixBaseX,
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        );
      case "X":
        return formatBaseX(
          value,
          16,
          prefixBaseX,
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        ).toUpperCase();
      case "u":
        return formatBaseX(
          value,
          10,
          prefixBaseX,
          leftJustify,
          minWidth,
          precision,
          zeroPad,
        );
      case "i":
      case "d":
        number = +value | 0;
        prefix = number < 0 ? "-" : positivePrefix;
        value = prefix + pad(String(Math.abs(number)), precision, "0", false);
        return justify(value, prefix, leftJustify, minWidth, zeroPad);
      case "e":
      case "E":
      case "f":
      case "F":
      case "g":
      case "G":
        number = +value;
        prefix = number < 0 ? "-" : positivePrefix;
        method = ["toExponential", "toFixed", "toPrecision"][
          "efg".indexOf(type.toLowerCase())
        ];
        textTransform = ["toString", "toUpperCase"]["eEfFgG".indexOf(type) % 2];
        value = prefix + Math.abs(number)[method](precision);
        return justify(value, prefix, leftJustify, minWidth, zeroPad)[
          textTransform
        ]();
      default:
        return substring;
    }
  };

  return format.replace(regex, doFormat);
}



export default sprintf;
