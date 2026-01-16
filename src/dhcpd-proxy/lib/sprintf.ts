/**
 * sprintf.ts
 *
 * Converted to a pure, strictly-typed TypeScript module.
 */
export default function sprintf(format: string, ...args: any[]): string {
  let i = 0
  const regex = /%%|%(\d+\$)?([-+'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g

  const pad = (str: string, len: number, chr: string, leftJustify: boolean): string => {
    const padding = str.length >= len ? '' : Array.from({ length: 1 + len - str.length }).join(chr || ' ')
    return leftJustify ? str + padding : padding + str
  }

  const justify = (value: string, prefix: string, leftJustify: boolean, minWidth: number, zeroPad: boolean, customPadChar?: string): string => {
    const diff = minWidth - value.length
    if (diff > 0) {
      if (leftJustify || !zeroPad) {
        value = pad(value, minWidth, customPadChar || ' ', leftJustify)
      } else {
        value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length)
      }
    }

    return value
  }

  const formatBaseX = (value: number, base: number, prefix: boolean, leftJustify: boolean, minWidth: number, precision: number | undefined, zeroPad: boolean): string => {
    const number = value >>> 0
    const p = (prefix && number && ({ 2: '0b', 8: '0', 16: '0x' } as const)[base]) || ''
    const val = p + pad(number.toString(base), precision || 0, '0', false)
    return justify(val, p, leftJustify, minWidth, zeroPad)
  }

  const formatString = (value: string, leftJustify: boolean, minWidth: number, precision: number | undefined, zeroPad: boolean, customPadChar?: string): string => {
    if (precision !== null && precision !== undefined) {
      value = value.slice(0, precision)
    }

    return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar)
  }

  const doFormat = (
    substring: string,
    valueIndex: string,
    flags: string,
    minWidthStr: string,
    _: any, // Explicitly type the unused parameter
    precisionStr: string,
    type: string
  ): string => {
    if (substring === '%%') {
      return '%'
    }

    let leftJustify = false
    let positivePrefix = ''
    let zeroPad = false
    let prefixBaseX = false
    let customPadChar = ' '
    for (let j = 0; flags && j < flags.length; j++) {
      switch (flags.charAt(j)) {
        case ' ': {
          positivePrefix = ' '
          break
        }

        case '0': {
          zeroPad = true
          break
        }

        case '#': {
          prefixBaseX = true
          break
        }

        case "'": {
          customPadChar = flags.charAt(j + 1)
          break
        }

        case '+': {
          positivePrefix = '+'
          break
        }

        case '-': {
          leftJustify = true
          break
        }
      }
    }

    let minWidth = minWidthStr ? +minWidthStr : 0
    if (minWidthStr === '*') {
      minWidth = +args[i++]
    } else if (minWidthStr?.charAt(0) === '*') {
      minWidth = +args[Number.parseInt(minWidthStr.slice(1, -1)) - 1]
    }

    if (minWidth < 0) {
      minWidth = -minWidth
      leftJustify = true
    }

    if (!isFinite(minWidth)) {
      throw new TypeError('sprintf: (minimum-)width must be finite')
    }

    let precision: number | undefined = precisionStr ? +precisionStr : undefined
    if (precisionStr === '*') {
      precision = +args[i++]
    } else if (precisionStr?.charAt(0) === '*') {
      precision = +args[Number.parseInt(precisionStr.slice(1, -1)) - 1]
    }

    if (precision === undefined) {
      precision = 'fFeE'.includes(type) ? 6 : type === 'd' ? 0 : undefined
    }

    const value = valueIndex ? args[Number.parseInt(valueIndex.slice(0, -1)) - 1] : args[i++]

    switch (type) {
      case 'b': {
        return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
      }

      case 'c': {
        return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad)
      }

      case 'd':
      case 'i': {
        const number = +value | 0
        const prefix = number < 0 ? '-' : positivePrefix
        const val = prefix + pad(String(Math.abs(number)), precision || 0, '0', false)
        return justify(val, prefix, leftJustify, minWidth, zeroPad)
      }

      case 'e':
      case 'E':
      case 'f':
      case 'F':
      case 'g':

      case 'G': {
        {
          const number = +value
          const prefix = number < 0 ? '-' : positivePrefix
          const method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())] as 'toExponential' | 'toFixed' | 'toPrecision'
          const textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2] as 'toString' | 'toUpperCase'
          const val = prefix + (Math.abs(number) as any)[method](precision)
          return (justify(val, prefix, leftJustify, minWidth, zeroPad) as any)[textTransform]()
        }
      }

      case 'o': {
        {
          return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
        }
      }

      case 's': {
        {
          return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar)
        }
      }

      case 'u': {
        {
          return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
        }
      }

      case 'x': {
        {
          return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
        }
      }

      case 'X': {
        return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase()
      }

      default: {
        return substring
      }
    }
  }

  return format.replaceAll(regex, doFormat)
}
