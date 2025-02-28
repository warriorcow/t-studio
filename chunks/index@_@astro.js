import { A as AstroError, E as ExpectedImage, L as LocalImageUsedWrongly, M as MissingImageDimension, U as UnsupportedImageFormat, I as IncompatibleDescriptorOptions, a as UnsupportedImageConversion, N as NoImageMetadata, F as FailedToFetchRemoteImageDimensions, b as ExpectedImageOptions, c as ExpectedNotESMImage, d as InvalidImageService, t as toStyleString, e as createAstro, f as createComponent, g as ImageMissingAlt, m as maybeRenderHead, h as addAttribute, s as spreadAttributes, r as renderTemplate, i as renderComponent, j as renderSlot, k as renderHead, l as renderScript } from './astro/server.js';
import 'kleur/colors';
import 'html-escaper';
import { isRemotePath, joinPaths } from '@astrojs/internal-helpers/path';
import * as mime from 'mrmime';
import 'clsx';
/* empty css      */
import '../renderers.mjs';

const VALID_SUPPORTED_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "webp",
  "gif",
  "svg",
  "avif"
];
const DEFAULT_OUTPUT_FORMAT = "webp";
const DEFAULT_HASH_PROPS = [
  "src",
  "width",
  "height",
  "format",
  "quality",
  "fit",
  "position"
];

const DEFAULT_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  960,
  // older horizontal phones
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  1920,
  // 1080p
  2048,
  // QXGA
  2560,
  // WQXGA
  3200,
  // QHD+
  3840,
  // 4K
  4480,
  // 4.5K
  5120,
  // 5K
  6016
  // 6K
];
const LIMITED_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  2048,
  // QXGA
  2560
  // WQXGA
];
const getWidths = ({
  width,
  layout,
  breakpoints = DEFAULT_RESOLUTIONS,
  originalWidth
}) => {
  const smallerThanOriginal = (w) => !originalWidth || w <= originalWidth;
  if (layout === "full-width") {
    return breakpoints.filter(smallerThanOriginal);
  }
  if (!width) {
    return [];
  }
  const doubleWidth = width * 2;
  const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
  if (layout === "fixed") {
    return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
  }
  if (layout === "responsive") {
    return [
      // Always include the image at 1x and 2x the specified width
      width,
      doubleWidth,
      ...breakpoints
    ].filter((w) => w <= maxSize).sort((a, b) => a - b);
  }
  return [];
};
const getSizesAttribute = ({
  width,
  layout
}) => {
  if (!width || !layout) {
    return void 0;
  }
  switch (layout) {
    // If screen is wider than the max size then image width is the max size,
    // otherwise it's the width of the screen
    case `responsive`:
      return `(min-width: ${width}px) ${width}px, 100vw`;
    // Image is always the same width, whatever the size of the screen
    case `fixed`:
      return `${width}px`;
    // Image is always the width of the screen
    case `full-width`:
      return `100vw`;
    case "none":
    default:
      return void 0;
  }
};

function isESMImportedImage(src) {
  return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage(src) {
  return typeof src === "string";
}
async function resolveSrc(src) {
  return typeof src === "object" && "then" in src ? (await src).default ?? await src : src;
}

function matchPattern(url, remotePattern) {
  return matchProtocol(url, remotePattern.protocol) && matchHostname(url, remotePattern.hostname, true) && matchPort(url, remotePattern.port) && matchPathname(url, remotePattern.pathname);
}
function matchPort(url, port) {
  return !port || port === url.port;
}
function matchProtocol(url, protocol) {
  return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname(url, hostname, allowWildcard) {
  if (!hostname) {
    return true;
  } else if (!allowWildcard || !hostname.startsWith("*")) {
    return hostname === url.hostname;
  } else if (hostname.startsWith("**.")) {
    const slicedHostname = hostname.slice(2);
    return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
  } else if (hostname.startsWith("*.")) {
    const slicedHostname = hostname.slice(1);
    const additionalSubdomains = url.hostname.replace(slicedHostname, "").split(".").filter(Boolean);
    return additionalSubdomains.length === 1;
  }
  return false;
}
function matchPathname(url, pathname, allowWildcard) {
  if (!pathname) {
    return true;
  } else if (!pathname.endsWith("*")) {
    return pathname === url.pathname;
  } else if (pathname.endsWith("/**")) {
    const slicedPathname = pathname.slice(0, -2);
    return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
  } else if (pathname.endsWith("/*")) {
    const slicedPathname = pathname.slice(0, -1);
    const additionalPathChunks = url.pathname.replace(slicedPathname, "").split("/").filter(Boolean);
    return additionalPathChunks.length === 1;
  }
  return false;
}
function isRemoteAllowed(src, {
  domains = [],
  remotePatterns = []
}) {
  if (!isRemotePath(src)) return false;
  const url = new URL(src);
  return domains.some((domain) => matchHostname(url, domain)) || remotePatterns.some((remotePattern) => matchPattern(url, remotePattern));
}

function isLocalService(service) {
  if (!service) {
    return false;
  }
  return "transform" in service;
}
function parseQuality(quality) {
  let result = parseInt(quality);
  if (Number.isNaN(result)) {
    return quality;
  }
  return result;
}
const sortNumeric = (a, b) => a - b;
const baseService = {
  validateOptions(options) {
    if (!options.src || !isRemoteImage(options.src) && !isESMImportedImage(options.src)) {
      throw new AstroError({
        ...ExpectedImage,
        message: ExpectedImage.message(
          JSON.stringify(options.src),
          typeof options.src,
          JSON.stringify(options, (_, v) => v === void 0 ? null : v)
        )
      });
    }
    if (!isESMImportedImage(options.src)) {
      if (options.src.startsWith("/@fs/") || !isRemotePath(options.src) && !options.src.startsWith("/")) {
        throw new AstroError({
          ...LocalImageUsedWrongly,
          message: LocalImageUsedWrongly.message(options.src)
        });
      }
      let missingDimension;
      if (!options.width && !options.height) {
        missingDimension = "both";
      } else if (!options.width && options.height) {
        missingDimension = "width";
      } else if (options.width && !options.height) {
        missingDimension = "height";
      }
      if (missingDimension) {
        throw new AstroError({
          ...MissingImageDimension,
          message: MissingImageDimension.message(missingDimension, options.src)
        });
      }
    } else {
      if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) {
        throw new AstroError({
          ...UnsupportedImageFormat,
          message: UnsupportedImageFormat.message(
            options.src.format,
            options.src.src,
            VALID_SUPPORTED_FORMATS
          )
        });
      }
      if (options.widths && options.densities) {
        throw new AstroError(IncompatibleDescriptorOptions);
      }
      if (options.src.format === "svg") {
        options.format = "svg";
      }
      if (options.src.format === "svg" && options.format !== "svg" || options.src.format !== "svg" && options.format === "svg") {
        throw new AstroError(UnsupportedImageConversion);
      }
    }
    if (!options.format) {
      options.format = DEFAULT_OUTPUT_FORMAT;
    }
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);
    if (options.layout && options.width && options.height) {
      options.fit ??= "cover";
      delete options.layout;
    }
    if (options.fit === "none") {
      delete options.fit;
    }
    return options;
  },
  getHTMLAttributes(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const {
      src,
      width,
      height,
      format,
      quality,
      densities,
      widths,
      formats,
      layout,
      priority,
      fit,
      position,
      ...attributes
    } = options;
    return {
      ...attributes,
      width: targetWidth,
      height: targetHeight,
      loading: attributes.loading ?? "lazy",
      decoding: attributes.decoding ?? "async"
    };
  },
  getSrcSet(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const aspectRatio = targetWidth / targetHeight;
    const { widths, densities } = options;
    const targetFormat = options.format ?? DEFAULT_OUTPUT_FORMAT;
    let transformedWidths = (widths ?? []).sort(sortNumeric);
    let imageWidth = options.width;
    let maxWidth = Infinity;
    if (isESMImportedImage(options.src)) {
      imageWidth = options.src.width;
      maxWidth = imageWidth;
      if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
        transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
        transformedWidths.push(maxWidth);
      }
    }
    transformedWidths = Array.from(new Set(transformedWidths));
    const {
      width: transformWidth,
      height: transformHeight,
      ...transformWithoutDimensions
    } = options;
    let allWidths = [];
    if (densities) {
      const densityValues = densities.map((density) => {
        if (typeof density === "number") {
          return density;
        } else {
          return parseFloat(density);
        }
      });
      const densityWidths = densityValues.sort(sortNumeric).map((density) => Math.round(targetWidth * density));
      allWidths = densityWidths.map((width, index) => ({
        width,
        descriptor: `${densityValues[index]}x`
      }));
    } else if (transformedWidths.length > 0) {
      allWidths = transformedWidths.map((width) => ({
        width,
        descriptor: `${width}w`
      }));
    }
    return allWidths.map(({ width, descriptor }) => {
      const height = Math.round(width / aspectRatio);
      const transform = { ...transformWithoutDimensions, width, height };
      return {
        transform,
        descriptor,
        attributes: {
          type: `image/${targetFormat}`
        }
      };
    });
  },
  getURL(options, imageConfig) {
    const searchParams = new URLSearchParams();
    if (isESMImportedImage(options.src)) {
      searchParams.append("href", options.src.src);
    } else if (isRemoteAllowed(options.src, imageConfig)) {
      searchParams.append("href", options.src);
    } else {
      return options.src;
    }
    const params = {
      w: "width",
      h: "height",
      q: "quality",
      f: "format",
      fit: "fit",
      position: "position"
    };
    Object.entries(params).forEach(([param, key]) => {
      options[key] && searchParams.append(param, options[key].toString());
    });
    const imageEndpoint = joinPaths("/", imageConfig.endpoint.route);
    return `${imageEndpoint}?${searchParams}`;
  },
  parseURL(url) {
    const params = url.searchParams;
    if (!params.has("href")) {
      return void 0;
    }
    const transform = {
      src: params.get("href"),
      width: params.has("w") ? parseInt(params.get("w")) : void 0,
      height: params.has("h") ? parseInt(params.get("h")) : void 0,
      format: params.get("f"),
      quality: params.get("q"),
      fit: params.get("fit"),
      position: params.get("position") ?? void 0
    };
    return transform;
  }
};
function getTargetDimensions(options) {
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (isESMImportedImage(options.src)) {
    const aspectRatio = options.src.width / options.src.height;
    if (targetHeight && !targetWidth) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else if (targetWidth && !targetHeight) {
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (!targetWidth && !targetHeight) {
      targetWidth = options.src.width;
      targetHeight = options.src.height;
    }
  }
  return {
    targetWidth,
    targetHeight
  };
}

function isImageMetadata(src) {
  return src.fsPath && !("fsPath" in src);
}

const decoder = new TextDecoder();
const toUTF8String = (input, start = 0, end = input.length) => decoder.decode(input.slice(start, end));
const toHexString = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i) => memo + ("0" + i.toString(16)).slice(-2), "");
const readInt16LE = (input, offset = 0) => {
  const val = input[offset] + input[offset + 1] * 2 ** 8;
  return val | (val & 2 ** 15) * 131070;
};
const readUInt16BE = (input, offset = 0) => input[offset] * 2 ** 8 + input[offset + 1];
const readUInt16LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8;
const readUInt24LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16;
const readInt32LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16 + (input[offset + 3] << 24);
const readUInt32BE = (input, offset = 0) => input[offset] * 2 ** 24 + input[offset + 1] * 2 ** 16 + input[offset + 2] * 2 ** 8 + input[offset + 3];
const readUInt32LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16 + input[offset + 3] * 2 ** 24;
const methods = {
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE
};
function readUInt(input, bits, offset, isBigEndian) {
  offset = offset || 0;
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = "readUInt" + bits + endian;
  return methods[methodName](input, offset);
}
function readBox(buffer, offset) {
  if (buffer.length - offset < 4) return;
  const boxSize = readUInt32BE(buffer, offset);
  if (buffer.length - offset < boxSize) return;
  return {
    name: toUTF8String(buffer, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox(buffer, boxName, offset) {
  while (offset < buffer.length) {
    const box = readBox(buffer, offset);
    if (!box) break;
    if (box.name === boxName) return box;
    offset += box.size;
  }
}

const BMP = {
  validate: (input) => toUTF8String(input, 0, 2) === "BM",
  calculate: (input) => ({
    height: Math.abs(readInt32LE(input, 22)),
    width: readUInt32LE(input, 18)
  })
};

const TYPE_ICON = 1;
const SIZE_HEADER$1 = 2 + 2 + 2;
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
function getSizeFromOffset(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize$1(input, imageIndex) {
  const offset = SIZE_HEADER$1 + imageIndex * SIZE_IMAGE_ENTRY;
  return {
    height: getSizeFromOffset(input, offset + 1),
    width: getSizeFromOffset(input, offset)
  };
}
const ICO = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_ICON;
  },
  calculate(input) {
    const nbImages = readUInt16LE(input, 4);
    const imageSize = getImageSize$1(input, 0);
    if (nbImages === 1) return imageSize;
    const imgs = [imageSize];
    for (let imageIndex = 1; imageIndex < nbImages; imageIndex += 1) {
      imgs.push(getImageSize$1(input, imageIndex));
    }
    return {
      height: imageSize.height,
      images: imgs,
      width: imageSize.width
    };
  }
};

const TYPE_CURSOR = 2;
const CUR = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_CURSOR;
  },
  calculate: (input) => ICO.calculate(input)
};

const DDS = {
  validate: (input) => readUInt32LE(input, 0) === 542327876,
  calculate: (input) => ({
    height: readUInt32LE(input, 12),
    width: readUInt32LE(input, 16)
  })
};

const gifRegexp = /^GIF8[79]a/;
const GIF = {
  validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
  calculate: (input) => ({
    height: readUInt16LE(input, 8),
    width: readUInt16LE(input, 6)
  })
};

const brandMap = {
  avif: "avif",
  mif1: "heif",
  msf1: "heif",
  // hief-sequence
  heic: "heic",
  heix: "heic",
  hevc: "heic",
  // heic-sequence
  hevx: "heic"
  // heic-sequence
};
function detectBrands(buffer, start, end) {
  let brandsDetected = {};
  for (let i = start; i <= end; i += 4) {
    const brand = toUTF8String(buffer, i, i + 4);
    if (brand in brandMap) {
      brandsDetected[brand] = 1;
    }
  }
  if ("avif" in brandsDetected) {
    return "avif";
  } else if ("heic" in brandsDetected || "heix" in brandsDetected || "hevc" in brandsDetected || "hevx" in brandsDetected) {
    return "heic";
  } else if ("mif1" in brandsDetected || "msf1" in brandsDetected) {
    return "heif";
  }
}
const HEIF = {
  validate(buffer) {
    const ftype = toUTF8String(buffer, 4, 8);
    const brand = toUTF8String(buffer, 8, 12);
    return "ftyp" === ftype && brand in brandMap;
  },
  calculate(buffer) {
    const metaBox = findBox(buffer, "meta", 0);
    const iprpBox = metaBox && findBox(buffer, "iprp", metaBox.offset + 12);
    const ipcoBox = iprpBox && findBox(buffer, "ipco", iprpBox.offset + 8);
    const ispeBox = ipcoBox && findBox(buffer, "ispe", ipcoBox.offset + 8);
    if (ispeBox) {
      return {
        height: readUInt32BE(buffer, ispeBox.offset + 16),
        width: readUInt32BE(buffer, ispeBox.offset + 12),
        type: detectBrands(buffer, 8, metaBox.offset)
      };
    }
    throw new TypeError("Invalid HEIF, no size found");
  }
};

const SIZE_HEADER = 4 + 4;
const FILE_LENGTH_OFFSET = 4;
const ENTRY_LENGTH_OFFSET = 4;
const ICON_TYPE_SIZE = {
  ICON: 32,
  "ICN#": 32,
  // m => 16 x 16
  "icm#": 16,
  icm4: 16,
  icm8: 16,
  // s => 16 x 16
  "ics#": 16,
  ics4: 16,
  ics8: 16,
  is32: 16,
  s8mk: 16,
  icp4: 16,
  // l => 32 x 32
  icl4: 32,
  icl8: 32,
  il32: 32,
  l8mk: 32,
  icp5: 32,
  ic11: 32,
  // h => 48 x 48
  ich4: 48,
  ich8: 48,
  ih32: 48,
  h8mk: 48,
  // . => 64 x 64
  icp6: 64,
  ic12: 32,
  // t => 128 x 128
  it32: 128,
  t8mk: 128,
  ic07: 128,
  // . => 256 x 256
  ic08: 256,
  ic13: 256,
  // . => 512 x 512
  ic09: 512,
  ic14: 512,
  // . => 1024 x 1024
  ic10: 1024
};
function readImageHeader(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
  return [
    toUTF8String(input, imageOffset, imageLengthOffset),
    readUInt32BE(input, imageLengthOffset)
  ];
}
function getImageSize(type) {
  const size = ICON_TYPE_SIZE[type];
  return { width: size, height: size, type };
}
const ICNS = {
  validate: (input) => toUTF8String(input, 0, 4) === "icns",
  calculate(input) {
    const inputLength = input.length;
    const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET);
    let imageOffset = SIZE_HEADER;
    let imageHeader = readImageHeader(input, imageOffset);
    let imageSize = getImageSize(imageHeader[0]);
    imageOffset += imageHeader[1];
    if (imageOffset === fileLength) return imageSize;
    const result = {
      height: imageSize.height,
      images: [imageSize],
      width: imageSize.width
    };
    while (imageOffset < fileLength && imageOffset < inputLength) {
      imageHeader = readImageHeader(input, imageOffset);
      imageSize = getImageSize(imageHeader[0]);
      imageOffset += imageHeader[1];
      result.images.push(imageSize);
    }
    return result;
  }
};

const J2C = {
  // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
  validate: (input) => toHexString(input, 0, 4) === "ff4fff51",
  calculate: (input) => ({
    height: readUInt32BE(input, 12),
    width: readUInt32BE(input, 8)
  })
};

const JP2 = {
  validate(input) {
    if (readUInt32BE(input, 4) !== 1783636e3 || readUInt32BE(input, 0) < 1) return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    return readUInt32BE(input, ftypBox.offset + 4) === 1718909296;
  },
  calculate(input) {
    const jp2hBox = findBox(input, "jp2h", 0);
    const ihdrBox = jp2hBox && findBox(input, "ihdr", jp2hBox.offset + 8);
    if (ihdrBox) {
      return {
        height: readUInt32BE(input, ihdrBox.offset + 8),
        width: readUInt32BE(input, ihdrBox.offset + 12)
      };
    }
    throw new TypeError("Unsupported JPEG 2000 format");
  }
};

const EXIF_MARKER = "45786966";
const APP1_DATA_SIZE_BYTES = 2;
const EXIF_HEADER_BYTES = 6;
const TIFF_BYTE_ALIGN_BYTES = 2;
const BIG_ENDIAN_BYTE_ALIGN = "4d4d";
const LITTLE_ENDIAN_BYTE_ALIGN = "4949";
const IDF_ENTRY_BYTES = 12;
const NUM_DIRECTORY_ENTRIES_BYTES = 2;
function isEXIF(input) {
  return toHexString(input, 2, 6) === EXIF_MARKER;
}
function extractSize(input, index) {
  return {
    height: readUInt16BE(input, index),
    width: readUInt16BE(input, index + 2)
  };
}
function extractOrientation(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES + idfOffset;
  const idfDirectoryEntries = readUInt(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
    const end = start + IDF_ENTRY_BYTES;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
  const byteAlign = toHexString(
    exifBlock,
    EXIF_HEADER_BYTES,
    EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation(exifBlock, isBigEndian);
  }
}
function validateInput(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
const JPG = {
  validate: (input) => toHexString(input, 0, 2) === "ffd8",
  calculate(input) {
    input = input.slice(4);
    let orientation;
    let next;
    while (input.length) {
      const i = readUInt16BE(input, 0);
      if (input[i] !== 255) {
        input = input.slice(i);
        continue;
      }
      if (isEXIF(input)) {
        orientation = validateExifBlock(input, i);
      }
      validateInput(input, i);
      next = input[i + 1];
      if (next === 192 || next === 193 || next === 194) {
        const size = extractSize(input, i + 5);
        if (!orientation) {
          return size;
        }
        return {
          height: size.height,
          orientation,
          width: size.width
        };
      }
      input = input.slice(i + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
};

const KTX = {
  validate: (input) => {
    const signature = toUTF8String(input, 1, 7);
    return ["KTX 11", "KTX 20"].includes(signature);
  },
  calculate: (input) => {
    const type = input[5] === 49 ? "ktx" : "ktx2";
    const offset = type === "ktx" ? 36 : 20;
    return {
      height: readUInt32LE(input, offset + 4),
      width: readUInt32LE(input, offset),
      type
    };
  }
};

const pngSignature = "PNG\r\n\n";
const pngImageHeaderChunkName = "IHDR";
const pngFriedChunkName = "CgBI";
const PNG = {
  validate(input) {
    if (pngSignature === toUTF8String(input, 1, 8)) {
      let chunkName = toUTF8String(input, 12, 16);
      if (chunkName === pngFriedChunkName) {
        chunkName = toUTF8String(input, 28, 32);
      }
      if (chunkName !== pngImageHeaderChunkName) {
        throw new TypeError("Invalid PNG");
      }
      return true;
    }
    return false;
  },
  calculate(input) {
    if (toUTF8String(input, 12, 16) === pngFriedChunkName) {
      return {
        height: readUInt32BE(input, 36),
        width: readUInt32BE(input, 32)
      };
    }
    return {
      height: readUInt32BE(input, 20),
      width: readUInt32BE(input, 16)
    };
  }
};

const PNMTypes = {
  P1: "pbm/ascii",
  P2: "pgm/ascii",
  P3: "ppm/ascii",
  P4: "pbm",
  P5: "pgm",
  P6: "ppm",
  P7: "pam",
  PF: "pfm"
};
const handlers = {
  default: (lines) => {
    let dimensions = [];
    while (lines.length > 0) {
      const line = lines.shift();
      if (line[0] === "#") {
        continue;
      }
      dimensions = line.split(" ");
      break;
    }
    if (dimensions.length === 2) {
      return {
        height: parseInt(dimensions[1], 10),
        width: parseInt(dimensions[0], 10)
      };
    } else {
      throw new TypeError("Invalid PNM");
    }
  },
  pam: (lines) => {
    const size = {};
    while (lines.length > 0) {
      const line = lines.shift();
      if (line.length > 16 || line.charCodeAt(0) > 128) {
        continue;
      }
      const [key, value] = line.split(" ");
      if (key && value) {
        size[key.toLowerCase()] = parseInt(value, 10);
      }
      if (size.height && size.width) {
        break;
      }
    }
    if (size.height && size.width) {
      return {
        height: size.height,
        width: size.width
      };
    } else {
      throw new TypeError("Invalid PAM");
    }
  }
};
const PNM = {
  validate: (input) => toUTF8String(input, 0, 2) in PNMTypes,
  calculate(input) {
    const signature = toUTF8String(input, 0, 2);
    const type = PNMTypes[signature];
    const lines = toUTF8String(input, 3).split(/[\r\n]+/);
    const handler = handlers[type] || handlers.default;
    return handler(lines);
  }
};

const PSD = {
  validate: (input) => toUTF8String(input, 0, 4) === "8BPS",
  calculate: (input) => ({
    height: readUInt32BE(input, 14),
    width: readUInt32BE(input, 18)
  })
};

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
const extractorRegExps = {
  height: /\sheight=(['"])([^%]+?)\1/,
  root: svgReg,
  viewbox: /\sviewBox=(['"])(.+?)\1/i,
  width: /\swidth=(['"])([^%]+?)\1/
};
const INCH_CM = 2.54;
const units = {
  in: 96,
  cm: 96 / INCH_CM,
  em: 16,
  ex: 8,
  m: 96 / INCH_CM * 100,
  mm: 96 / INCH_CM / 10,
  pc: 96 / 72 / 12,
  pt: 96 / 72,
  px: 1
};
const unitsReg = new RegExp(
  `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join("|")})?$`
);
function parseLength(len) {
  const m = unitsReg.exec(len);
  if (!m) {
    return void 0;
  }
  return Math.round(Number(m[1]) * (units[m[2]] || 1));
}
function parseViewbox(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength(bounds[3]),
    width: parseLength(bounds[2])
  };
}
function parseAttributes(root) {
  const width = extractorRegExps.width.exec(root);
  const height = extractorRegExps.height.exec(root);
  const viewbox = extractorRegExps.viewbox.exec(root);
  return {
    height: height && parseLength(height[2]),
    viewbox: viewbox && parseViewbox(viewbox[2]),
    width: width && parseLength(width[2])
  };
}
function calculateByDimensions(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
const SVG = {
  // Scan only the first kilo-byte to speed up the check on larger files
  validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3)),
  calculate(input) {
    const root = extractorRegExps.root.exec(toUTF8String(input));
    if (root) {
      const attrs = parseAttributes(root[0]);
      if (attrs.width && attrs.height) {
        return calculateByDimensions(attrs);
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox);
      }
    }
    throw new TypeError("Invalid SVG");
  }
};

const TGA = {
  validate(input) {
    return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
  },
  calculate(input) {
    return {
      height: readUInt16LE(input, 14),
      width: readUInt16LE(input, 12)
    };
  }
};

function readIFD(input, isBigEndian) {
  const ifdOffset = readUInt(input, 32, 4, isBigEndian);
  return input.slice(ifdOffset + 2);
}
function readValue(input, isBigEndian) {
  const low = readUInt(input, 16, 8, isBigEndian);
  const high = readUInt(input, 16, 10, isBigEndian);
  return (high << 16) + low;
}
function nextTag(input) {
  if (input.length > 24) {
    return input.slice(12);
  }
}
function extractTags(input, isBigEndian) {
  const tags = {};
  let temp = input;
  while (temp && temp.length) {
    const code = readUInt(temp, 16, 0, isBigEndian);
    const type = readUInt(temp, 16, 2, isBigEndian);
    const length = readUInt(temp, 32, 4, isBigEndian);
    if (code === 0) {
      break;
    } else {
      if (length === 1 && (type === 3 || type === 4)) {
        tags[code] = readValue(temp, isBigEndian);
      }
      temp = nextTag(temp);
    }
  }
  return tags;
}
function determineEndianness(input) {
  const signature = toUTF8String(input, 0, 2);
  if ("II" === signature) {
    return "LE";
  } else if ("MM" === signature) {
    return "BE";
  }
}
const signatures = [
  // '492049', // currently not supported
  "49492a00",
  // Little endian
  "4d4d002a"
  // Big Endian
  // '4d4d002a', // BigTIFF > 4GB. currently not supported
];
const TIFF = {
  validate: (input) => signatures.includes(toHexString(input, 0, 4)),
  calculate(input) {
    const isBigEndian = determineEndianness(input) === "BE";
    const ifdBuffer = readIFD(input, isBigEndian);
    const tags = extractTags(ifdBuffer, isBigEndian);
    const width = tags[256];
    const height = tags[257];
    if (!width || !height) {
      throw new TypeError("Invalid Tiff. Missing tags");
    }
    return { height, width };
  }
};

function calculateExtended(input) {
  return {
    height: 1 + readUInt24LE(input, 7),
    width: 1 + readUInt24LE(input, 4)
  };
}
function calculateLossless(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy(input) {
  return {
    height: readInt16LE(input, 8) & 16383,
    width: readInt16LE(input, 6) & 16383
  };
}
const WEBP = {
  validate(input) {
    const riffHeader = "RIFF" === toUTF8String(input, 0, 4);
    const webpHeader = "WEBP" === toUTF8String(input, 8, 12);
    const vp8Header = "VP8" === toUTF8String(input, 12, 15);
    return riffHeader && webpHeader && vp8Header;
  },
  calculate(input) {
    const chunkHeader = toUTF8String(input, 12, 16);
    input = input.slice(20, 30);
    if (chunkHeader === "VP8X") {
      const extendedHeader = input[0];
      const validStart = (extendedHeader & 192) === 0;
      const validEnd = (extendedHeader & 1) === 0;
      if (validStart && validEnd) {
        return calculateExtended(input);
      } else {
        throw new TypeError("Invalid WebP");
      }
    }
    if (chunkHeader === "VP8 " && input[0] !== 47) {
      return calculateLossy(input);
    }
    const signature = toHexString(input, 3, 6);
    if (chunkHeader === "VP8L" && signature !== "9d012a") {
      return calculateLossless(input);
    }
    throw new TypeError("Invalid WebP");
  }
};

const typeHandlers = /* @__PURE__ */ new Map([
  ["bmp", BMP],
  ["cur", CUR],
  ["dds", DDS],
  ["gif", GIF],
  ["heif", HEIF],
  ["icns", ICNS],
  ["ico", ICO],
  ["j2c", J2C],
  ["jp2", JP2],
  ["jpg", JPG],
  ["ktx", KTX],
  ["png", PNG],
  ["pnm", PNM],
  ["psd", PSD],
  ["svg", SVG],
  ["tga", TGA],
  ["tiff", TIFF],
  ["webp", WEBP]
]);
const types = Array.from(typeHandlers.keys());

const firstBytes = /* @__PURE__ */ new Map([
  [56, "psd"],
  [66, "bmp"],
  [68, "dds"],
  [71, "gif"],
  [73, "tiff"],
  [77, "tiff"],
  [82, "webp"],
  [105, "icns"],
  [137, "png"],
  [255, "jpg"]
]);
function detector(input) {
  const byte = input[0];
  const type = firstBytes.get(byte);
  if (type && typeHandlers.get(type).validate(input)) {
    return type;
  }
  return types.find((fileType) => typeHandlers.get(fileType).validate(input));
}

const globalOptions = {
  disabledTypes: []
};
function lookup(input) {
  const type = detector(input);
  if (typeof type !== "undefined") {
    if (globalOptions.disabledTypes.includes(type)) {
      throw new TypeError("disabled file type: " + type);
    }
    const size = typeHandlers.get(type).calculate(input);
    if (size !== void 0) {
      size.type = size.type ?? type;
      return size;
    }
  }
  throw new TypeError("unsupported file type: " + type);
}

async function imageMetadata(data, src) {
  try {
    const result = lookup(data);
    if (!result.height || !result.width || !result.type) {
      throw new AstroError({
        ...NoImageMetadata,
        message: NoImageMetadata.message(src)
      });
    }
    const { width, height, type, orientation } = result;
    const isPortrait = (orientation || 0) >= 5;
    return {
      width: isPortrait ? height : width,
      height: isPortrait ? width : height,
      format: type,
      orientation
    };
  } catch {
    throw new AstroError({
      ...NoImageMetadata,
      message: NoImageMetadata.message(src)
    });
  }
}

async function inferRemoteSize(url) {
  const response = await fetch(url);
  if (!response.body || !response.ok) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  const reader = response.body.getReader();
  let done, value;
  let accumulatedChunks = new Uint8Array();
  while (!done) {
    const readResult = await reader.read();
    done = readResult.done;
    if (done) break;
    if (readResult.value) {
      value = readResult.value;
      let tmp = new Uint8Array(accumulatedChunks.length + value.length);
      tmp.set(accumulatedChunks, 0);
      tmp.set(value, accumulatedChunks.length);
      accumulatedChunks = tmp;
      try {
        const dimensions = await imageMetadata(accumulatedChunks, url);
        if (dimensions) {
          await reader.cancel();
          return dimensions;
        }
      } catch {
      }
    }
  }
  throw new AstroError({
    ...NoImageMetadata,
    message: NoImageMetadata.message(url)
  });
}

async function getConfiguredImageService() {
  if (!globalThis?.astroAsset?.imageService) {
    const { default: service } = await import(
      // @ts-expect-error
      './sharp.js'
    ).catch((e) => {
      const error = new AstroError(InvalidImageService);
      error.cause = e;
      throw error;
    });
    if (!globalThis.astroAsset) globalThis.astroAsset = {};
    globalThis.astroAsset.imageService = service;
    return service;
  }
  return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig) {
  if (!options || typeof options !== "object") {
    throw new AstroError({
      ...ExpectedImageOptions,
      message: ExpectedImageOptions.message(JSON.stringify(options))
    });
  }
  if (typeof options.src === "undefined") {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        options.src,
        "undefined",
        JSON.stringify(options)
      )
    });
  }
  if (isImageMetadata(options)) {
    throw new AstroError(ExpectedNotESMImage);
  }
  const service = await getConfiguredImageService();
  const resolvedOptions = {
    ...options,
    src: await resolveSrc(options.src)
  };
  let originalWidth;
  let originalHeight;
  let originalFormat;
  if (options.inferSize && isRemoteImage(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
    const result = await inferRemoteSize(resolvedOptions.src);
    resolvedOptions.width ??= result.width;
    resolvedOptions.height ??= result.height;
    originalWidth = result.width;
    originalHeight = result.height;
    originalFormat = result.format;
    delete resolvedOptions.inferSize;
  }
  const originalFilePath = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.fsPath : void 0;
  const clonedSrc = isESMImportedImage(resolvedOptions.src) ? (
    // @ts-expect-error - clone is a private, hidden prop
    resolvedOptions.src.clone ?? resolvedOptions.src
  ) : resolvedOptions.src;
  if (isESMImportedImage(clonedSrc)) {
    originalWidth = clonedSrc.width;
    originalHeight = clonedSrc.height;
    originalFormat = clonedSrc.format;
  }
  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (resolvedOptions.height && !resolvedOptions.width) {
      resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
    } else if (resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
    } else if (!resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.width = originalWidth;
      resolvedOptions.height = originalHeight;
    }
  }
  resolvedOptions.src = clonedSrc;
  const layout = options.layout ?? imageConfig.experimentalLayout;
  if (imageConfig.experimentalResponsiveImages && layout) {
    resolvedOptions.widths ||= getWidths({
      width: resolvedOptions.width,
      layout,
      originalWidth,
      breakpoints: imageConfig.experimentalBreakpoints?.length ? imageConfig.experimentalBreakpoints : isLocalService(service) ? LIMITED_RESOLUTIONS : DEFAULT_RESOLUTIONS
    });
    resolvedOptions.sizes ||= getSizesAttribute({ width: resolvedOptions.width, layout });
    if (resolvedOptions.priority) {
      resolvedOptions.loading ??= "eager";
      resolvedOptions.decoding ??= "sync";
      resolvedOptions.fetchpriority ??= "high";
    } else {
      resolvedOptions.loading ??= "lazy";
      resolvedOptions.decoding ??= "async";
      resolvedOptions.fetchpriority ??= "auto";
    }
    delete resolvedOptions.priority;
    delete resolvedOptions.densities;
  }
  const validatedOptions = service.validateOptions ? await service.validateOptions(resolvedOptions, imageConfig) : resolvedOptions;
  const srcSetTransforms = service.getSrcSet ? await service.getSrcSet(validatedOptions, imageConfig) : [];
  let imageURL = await service.getURL(validatedOptions, imageConfig);
  const matchesOriginal = (transform) => transform.width === originalWidth && transform.height === originalHeight && transform.format === originalFormat;
  let srcSets = await Promise.all(
    srcSetTransforms.map(async (srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesOriginal(srcSet.transform) ? imageURL : await service.getURL(srcSet.transform, imageConfig),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    })
  );
  if (isLocalService(service) && globalThis.astroAsset.addStaticImage && !(isRemoteImage(validatedOptions.src) && imageURL === validatedOptions.src)) {
    const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
    imageURL = globalThis.astroAsset.addStaticImage(
      validatedOptions,
      propsToHash,
      originalFilePath
    );
    srcSets = srcSetTransforms.map((srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesOriginal(srcSet.transform) ? imageURL : globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    });
  }
  return {
    rawOptions: resolvedOptions,
    options: validatedOptions,
    src: imageURL,
    srcSet: {
      values: srcSets,
      attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
    },
    attributes: service.getHTMLAttributes !== void 0 ? await service.getHTMLAttributes(validatedOptions, imageConfig) : {}
  };
}

function addCSSVarsToStyle(vars, styles) {
  const cssVars = Object.entries(vars).filter(([_, value]) => value !== void 0 && value !== false).map(([key, value]) => `--${key}: ${value};`).join(" ");
  if (!styles) {
    return cssVars;
  }
  const style = typeof styles === "string" ? styles : toStyleString(styles);
  return `${cssVars} ${style}`;
}
const cssFitValues = ["fill", "contain", "cover", "scale-down"];
function applyResponsiveAttributes({
  layout,
  image,
  props,
  additionalAttributes
}) {
  const attributes = { ...additionalAttributes, ...image.attributes };
  attributes.style = addCSSVarsToStyle(
    {
      w: image.attributes.width ?? props.width ?? image.options.width,
      h: image.attributes.height ?? props.height ?? image.options.height,
      fit: cssFitValues.includes(props.fit ?? "") && props.fit,
      pos: props.position
    },
    attributes.style
  );
  attributes["data-astro-image"] = layout;
  return attributes;
}

const $$Astro$a = createAstro("https://warriorcow.github.io/t-studio/");
const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$Image;
  const props = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  if (typeof props.width === "string") {
    props.width = parseInt(props.width);
  }
  if (typeof props.height === "string") {
    props.height = parseInt(props.height);
  }
  const layout = props.layout ?? imageConfig.experimentalLayout ?? "none";
  const useResponsive = imageConfig.experimentalResponsiveImages && layout !== "none";
  if (useResponsive) {
    props.layout ??= imageConfig.experimentalLayout;
    props.fit ??= imageConfig.experimentalObjectFit ?? "cover";
    props.position ??= imageConfig.experimentalObjectPosition ?? "center";
  }
  const image = await getImage(props);
  const additionalAttributes = {};
  if (image.srcSet.values.length > 0) {
    additionalAttributes.srcset = image.srcSet.attribute;
  }
  const { class: className, ...attributes } = useResponsive ? applyResponsiveAttributes({
    layout,
    image,
    props,
    additionalAttributes
  }) : { ...additionalAttributes, ...image.attributes };
  return renderTemplate`
${maybeRenderHead()}<img${addAttribute(image.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>`;
}, "/home/runner/work/t-studio/t-studio/node_modules/astro/components/Image.astro", void 0);

const $$Astro$9 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$Picture;
  const defaultFormats = ["webp"];
  const defaultFallbackFormat = "png";
  const specialFormatsFallback = ["gif", "svg", "jpg", "jpeg"];
  const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  const scopedStyleClass = props.class?.match(/\bastro-\w{8}\b/)?.[0];
  if (scopedStyleClass) {
    if (pictureAttributes.class) {
      pictureAttributes.class = `${pictureAttributes.class} ${scopedStyleClass}`;
    } else {
      pictureAttributes.class = scopedStyleClass;
    }
  }
  const layout = props.layout ?? imageConfig.experimentalLayout ?? "none";
  const useResponsive = imageConfig.experimentalResponsiveImages && layout !== "none";
  if (useResponsive) {
    props.layout ??= imageConfig.experimentalLayout;
    props.fit ??= imageConfig.experimentalObjectFit ?? "cover";
    props.position ??= imageConfig.experimentalObjectPosition ?? "center";
  }
  for (const key in props) {
    if (key.startsWith("data-astro-cid")) {
      pictureAttributes[key] = props[key];
    }
  }
  const originalSrc = await resolveSrc(props.src);
  const optimizedImages = await Promise.all(
    formats.map(
      async (format) => await getImage({
        ...props,
        src: originalSrc,
        format,
        widths: props.widths,
        densities: props.densities
      })
    )
  );
  let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
  if (!fallbackFormat && isESMImportedImage(originalSrc) && specialFormatsFallback.includes(originalSrc.format)) {
    resultFallbackFormat = originalSrc.format;
  }
  const fallbackImage = await getImage({
    ...props,
    format: resultFallbackFormat,
    widths: props.widths,
    densities: props.densities
  });
  const imgAdditionalAttributes = {};
  const sourceAdditionalAttributes = {};
  if (props.sizes) {
    sourceAdditionalAttributes.sizes = props.sizes;
  }
  if (fallbackImage.srcSet.values.length > 0) {
    imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
  }
  const { class: className, ...attributes } = useResponsive ? applyResponsiveAttributes({
    layout,
    image: fallbackImage,
    props,
    additionalAttributes: imgAdditionalAttributes
  }) : { ...imgAdditionalAttributes, ...fallbackImage.attributes };
  return renderTemplate`${maybeRenderHead()}<picture${spreadAttributes(pictureAttributes)}>
	${Object.entries(optimizedImages).map(([_, image]) => {
    const srcsetAttribute = props.densities || !props.densities && !props.widths && !useResponsive ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
    return renderTemplate`<source${addAttribute(srcsetAttribute, "srcset")}${addAttribute(mime.lookup(image.options.format ?? image.src) ?? `image/${image.options.format}`, "type")}${spreadAttributes(sourceAdditionalAttributes)}>`;
  })}
	
	<img${addAttribute(fallbackImage.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>
</picture>`;
}, "/home/runner/work/t-studio/t-studio/node_modules/astro/components/Picture.astro", void 0);

const imageConfig = {"endpoint":{"route":"/_image/"},"service":{"entrypoint":"astro/assets/services/sharp","config":{}},"domains":[],"remotePatterns":[],"experimentalResponsiveImages":false};
					const getImage = async (options) => await getImage$1(options, imageConfig);

const LogoImage = new Proxy({"src":"/assets/logo.svg","width":186,"height":42,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/logo.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/logo.svg");
							return target[name];
						}
					});

const $$Astro$8 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Button = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Button;
  const {
    class: className,
    iconRightSrc,
    text,
    href,
    size = "small",
    view = "default",
    ...rest
  } = Astro2.props;
  const Element = href ? "a" : "button";
  return renderTemplate`${renderComponent($$result, "Element", Element, { "class:list": [
    "button",
    size === "small" && "button--small",
    size === "medium" && "button--medium",
    size === "large" && "button--large",
    view === "ghost" && "button--ghost",
    className
  ], "href": href, ...rest }, { "default": ($$result2) => renderTemplate`${text}${iconRightSrc && renderTemplate`${renderComponent($$result2, "Image", $$Image, { "class": "button__icon-right", "src": iconRightSrc, "alt": "link-icon" })}`}` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/UI/Button.astro", void 0);

const $$Astro$7 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Container = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Container;
  const {
    class: className,
    gap,
    ...rest
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section${addAttribute(["container", gap ? "container--gap" : "", className], "class:list")}${spreadAttributes(rest)}>
  ${renderSlot($$result, $$slots["default"])}
</section>`;
}, "/home/runner/work/t-studio/t-studio/src/components/UI/Container.astro", void 0);

const $$Astro$6 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Header;
  const { menu_list } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<header class="header">
  ${renderComponent($$result, "Container", $$Container, { "class": "header__container" }, { "default": ($$result2) => renderTemplate`
    <div class="header__logo">
      ${renderComponent($$result2, "Image", $$Image, { "src": LogoImage, "alt": "T-Studio Logo" })}
    </div>
    <div class="header__side">
      <nav class="header__nav">
        ${menu_list.map(
    (menu) => renderTemplate`<a class="header__link"${addAttribute(menu.href, "href")}>${menu.text}</a>`
  )}
      </nav>
      ${renderComponent($$result2, "Button", $$Button, { "text": "\u041E\u0446\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442" })}
    </div>
  ` })}
</header>`;
}, "/home/runner/work/t-studio/t-studio/src/components/Header.astro", void 0);

const $$Astro$5 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Layout;
  const menu_list = [
    {
      text: "\u041E \u043D\u0430\u0441",
      href: "/"
    },
    {
      text: "\u0423\u0441\u043B\u0443\u0433\u0438",
      href: "/"
    },
    {
      text: "\u041F\u0440\u0438\u043C\u0435\u0440\u044B \u0440\u0430\u0431\u043E\u0442",
      href: "/"
    }
  ];
  return renderTemplate`<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/svg+xml" href="/favicon.svg">
		<meta name="generator"${addAttribute(Astro2.generator, "content")}>
		<title>Astro Basics</title>
	${renderHead()}</head>
	<body>
    ${renderComponent($$result, "Header", $$Header, { "menu_list": menu_list })}
    <main class="main">
      ${renderSlot($$result, $$slots["default"])}
    </main>
	</body></html>`;
}, "/home/runner/work/t-studio/t-studio/src/layouts/Layout.astro", void 0);

const AuchanLogo = new Proxy({"src":"/assets/auchan_logo.svg","width":147,"height":35,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/auchan_logo.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/auchan_logo.svg");
							return target[name];
						}
					});

const $$MarqueeSlider = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="marquee-slider">
  <div class="marquee-slider__swiper swiper">
    <div class="marquee-slider__wrapper swiper-wrapper">
      ${[...Array(30)].map(
    (_) => renderTemplate`<div class="marquee-slider__slide swiper-slide">
          ${renderComponent($$result, "Image", $$Image, { "src": AuchanLogo, "alt": "Logo" })}
        </div>`
  )}
    </div>
  </div>
</section>



${renderScript($$result, "/home/runner/work/t-studio/t-studio/src/components/MarqueeSlider.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/runner/work/t-studio/t-studio/src/components/MarqueeSlider.astro", void 0);

const LinkArrow = new Proxy({"src":"/assets/link-arrow.svg","width":35,"height":35,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/link-arrow.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/link-arrow.svg");
							return target[name];
						}
					});

const TopBannerBg1 = new Proxy({"src":"/assets/top-banner-bg-1.png","width":264,"height":327,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/top-banner-bg-1.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/top-banner-bg-1.png");
							return target[name];
						}
					});

const TopBannerBg2 = new Proxy({"src":"/assets/top-banner-bg-2.png","width":264,"height":327,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/top-banner-bg-2.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/top-banner-bg-2.png");
							return target[name];
						}
					});

const $$TopBanner = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="top-banner">
    <div class="top-banner__head">
      <div class="top-banner__title">
        Т-студия
      </div>
      <div class="top-banner__description">
        технологии, которые работают
        на ваш бизнес
      </div>
    </div>

    <div class="top-banner__footer">
      <div class="top-banner__item">
        <div class="top-banner__item-head">
          <span>10+</span>
        </div>
        <div class="top-banner__item-footer">
          <p>лет опыта</p>
        </div>
        ${renderComponent($$result2, "Image", $$Image, { "class": "top-banner__item-bg", "src": TopBannerBg1, "alt": "T-Studio Logo" })}
      </div>
      <div class="top-banner__item">
        <div class="top-banner__item-head">
          <span>350+</span>
        </div>
        <div class="top-banner__item-footer">
          <p>проектов реализовано</p>
        </div>
        ${renderComponent($$result2, "Image", $$Image, { "class": "top-banner__item-bg", "src": TopBannerBg2, "alt": "T-Studio Logo" })}
      </div>
      <div class="top-banner__item">
        <div class="top-banner__item-head">
          <span>95%</span>
          <p>клиентов остаются с нами</p>
        </div>
        <div class="top-banner__item-footer">
          ${renderComponent($$result2, "Button", $$Button, { "class": "top-banner__button", "text": "\u041E\u0446\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442", "size": "large", "view": "ghost", "iconRightSrc": LinkArrow })}
        </div>
      </div>
    </div>
  </div>
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/TopBanner.astro", void 0);

const $$Astro$4 = createAstro("https://warriorcow.github.io/t-studio/");
const $$Title = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Title;
  const {
    tag,
    text,
    gradient,
    color,
    isBlock,
    hasArrow,
    arrowPosition = "left"
  } = Astro2.props;
  const Element = tag;
  return renderTemplate`${renderComponent($$result, "Element", Element, { "class:list": ["title", color && `title--${color}`, isBlock && `title--block`, hasArrow && `title--arrow`, arrowPosition && `title--arrow-${arrowPosition}`] }, { "default": ($$result2) => renderTemplate`${text}` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/UI/Title.astro", void 0);

const $$Quote = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="quote">
    ${renderComponent($$result2, "Title", $$Title, { "hasArrow": true, "color": "gradient", "text": "\u041C\u044B \u043D\u0435 \u043F\u0440\u043E\u0441\u0442\u043E \u043A\u043E\u0434\u0438\u043C\xA0\u2014 \u043C\u044B \u0440\u0435\u0448\u0430\u0435\u043C \u0437\u0430\u0434\u0430\u0447\u0438 \u0431\u0438\u0437\u043D\u0435\u0441\u0430", "tag": "h2" })}
    <p class="quote__subtext">Автоматизируем процессы, улучшаем цифровые продукты, помогаем компаниям расти за счет IT-решений. Разрабатываем программное обеспечение, которое упрощает работу, снижает затраты и увеличивает прибыль.</p>
  </div>
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Quote.astro", void 0);

const $$Astro$3 = createAstro("https://warriorcow.github.io/t-studio/");
const $$ServiceCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$ServiceCard;
  const { icon, title, text } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="service-card">
  <div class="service-card__icon">
    ${renderComponent($$result, "Image", $$Image, { "src": icon, "alt": title })}
  </div>
  <div class="service-card__content">
    <div class="service-card__title">
      ${title}
    </div>
    <div class="service-card__text">
      ${text}
    </div>
  </div>
</div>`;
}, "/home/runner/work/t-studio/t-studio/src/components/ServiceCard.astro", void 0);

const ServiceIcon1 = new Proxy({"src":"/assets/service-icon-1.svg","width":49,"height":48,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/service-icon-1.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/service-icon-1.svg");
							return target[name];
						}
					});

const $$Services = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="services">
    <div class="services__column services__column--sticky">
      <div class="services__sticky">
        ${renderComponent($$result2, "Title", $$Title, { "tag": "h2", "text": "\u0423\u0441\u043B\u0443\u0433\u0438" })}
        <p class="services__description">Анализируем, проектируем, внедряем и поддерживаем.
          <a href="#">Делаем так, чтобы IT работало на вас, а не наоборот.</a>
        </p>
        ${renderComponent($$result2, "Button", $$Button, { "text": "\u041E\u0446\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442" })}
      </div>
    </div>

    <div class="services__column">
      <div class="services__subcolumn">
        ${renderComponent($$result2, "ServiceCard", $$ServiceCard, { "icon": ServiceIcon1, "title": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u041F\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447", "text": "\u0441\u043E\u0437\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043B\u044F, \u043E\u0442 \u0438\u0434\u0435\u0438 \u0434\u043E \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F." })}
        ${renderComponent($$result2, "ServiceCard", $$ServiceCard, { "icon": ServiceIcon1, "title": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u041F\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447", "text": "\u0441\u043E\u0437\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043B\u044F, \u043E\u0442 \u0438\u0434\u0435\u0438 \u0434\u043E \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F." })}
        ${renderComponent($$result2, "ServiceCard", $$ServiceCard, { "icon": ServiceIcon1, "title": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u041F\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447", "text": "\u0441\u043E\u0437\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043B\u044F, \u043E\u0442 \u0438\u0434\u0435\u0438 \u0434\u043E \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F." })}
      </div>
      <div class="services__subcolumn">
        ${renderComponent($$result2, "ServiceCard", $$ServiceCard, { "icon": ServiceIcon1, "title": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u041F\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447", "text": "\u0441\u043E\u0437\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043B\u044F, \u043E\u0442 \u0438\u0434\u0435\u0438 \u0434\u043E \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F." })}
        ${renderComponent($$result2, "ServiceCard", $$ServiceCard, { "icon": ServiceIcon1, "title": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u041F\u041E \u043F\u043E\u0434 \u043A\u043B\u044E\u0447", "text": "\u0441\u043E\u0437\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043B\u044F, \u043E\u0442 \u0438\u0434\u0435\u0438 \u0434\u043E \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F." })}
      </div>

    </div>
  </div>
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Services.astro", void 0);

const $$Astro$2 = createAstro("https://warriorcow.github.io/t-studio/");
const $$WorkCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$WorkCard;
  const { number, title, text } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="work-card">
  <div class="work-card__number">
    ${number}
  </div>
  <div class="work-card__content">
    <div class="work-card__title">
      ${title}
    </div>
    <div class="work-card__text">
      ${text}
    </div>
  </div>
</div>`;
}, "/home/runner/work/t-studio/t-studio/src/components/WorkCard.astro", void 0);

const $$Work = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="work">
    ${renderComponent($$result2, "Title", $$Title, { "color": "gradient", "text": "\u041A\u0430\u043A \u043C\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u043C", "tag": "h2" })}

    <div class="work__content">
      ${renderComponent($$result2, "WorkCard", $$WorkCard, { "number": "01", "title": "\u0421\u0432\u044F\u0437\u044C \u0438 \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430", "text": "\u041F\u043E\u0441\u043B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438 \u043C\u044B \u0441\u0432\u044F\u0436\u0435\u043C\u0441\u044F \u0441 \u0432\u0430\u043C\u0438, \u0447\u0442\u043E\u0431\u044B \u0443\u0442\u043E\u0447\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u0431\u0440\u0438\u0444 \u0438 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C\u0441\u044F \u0432 \u0437\u0430\u0434\u0430\u0447\u0435." })}
      ${renderComponent($$result2, "WorkCard", $$WorkCard, { "number": "02", "title": "\u0413\u0430\u0440\u0430\u043D\u0442\u0438\u044F \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438", "text": "\u0415\u0441\u043B\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E, \u043F\u043E\u0434\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u043C NDA, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0449\u0438\u0442\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435." })}
      ${renderComponent($$result2, "WorkCard", $$WorkCard, { "number": "03", "title": "\u041F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0444\u0444\u0435\u0440\u0430", "text": "\u0413\u043E\u0442\u043E\u0432\u0438\u043C \u0434\u0435\u0442\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D: \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438, \u0441\u0440\u043E\u043A\u0438, \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C." })}
      ${renderComponent($$result2, "WorkCard", $$WorkCard, { "number": "04", "title": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0441\u0442\u0430\u0440\u0442", "text": "\u041F\u043E\u0434\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u043C \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u043C \u0440\u0430\u0431\u043E\u0442\u0443." })}
    </div>
  </div>
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Work.astro", void 0);

const ColoredLogo = new Proxy({"src":"/assets/logo-colored.svg","width":185,"height":43,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/logo-colored.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/logo-colored.svg");
							return target[name];
						}
					});

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, {}, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<footer class="footer">
    <div class="footer__row">
      ${renderComponent($$result2, "Image", $$Image, { "class": "footer__logo", "src": ColoredLogo, "alt": "Logo" })}
    </div>
    <div class="footer__row">
      <p>
        Общество с ограниченной<br>
        ответственностью «Т-Студия»<br>
        Томская область, ОГРН: 1157017007180, дата<br>
        присвоения ОГРН: 22.04.2015<br>
        ИНН: 7017375554, КПП: 701701001<br>
        Директор: Дикович Татьяна Васильевна
      </p>

      <div class="footer__card">
        <div class="footer__card-title">
          Контакты:
        </div>
        <div class="footer__card-text">
          <a href="mailto:email@mail.ru">email@mail.ru</a>
          <a href="tel:+7(999)999-99-99">+7(999)999-99-99</a>
        </div>
      </div>
    </div>
    <div class="footer__row footer__row--end">
      <div>
        <div class="footer__card">
          <div class="footer__card-title">
            Юридический адрес:
          </div>
          <div class="footer__card-text">
            Томская обл., г. Томск ул., Больничная д.4/1
          </div>
        </div>
        <div class="footer__card">
          <div class="footer__card-title">
            Фактический адрес:
          </div>
          <div class="footer__card-text">
            634003,Томская обл., г. Томск ул., Больничная д.4/1
          </div>
        </div>
      </div>
      <div class="footer__card">
        <div class="footer__card-title">
          Банковские реквизиты:
        </div>
        <div class="footer__card-text">
          ФИЛИАЛ «НОВОСИБИРСКИЙ» АО «АЛЬФА-БАНК»,<br>
          БИК 045004774<br>
          р/с 40702810523010001071<br>
          к/с 30101810600000000774
        </div>
      </div>
    </div>
    <div class="footer__row">
      <div class="footer__copyright">
        <p>2025 Все права защищены.</p>
        <p>
          <a href="#">Пользовательское соглашение.</a>
          <a href="#">Политика обработки персональных данных.</a>
        </p>
      </div>
    </div>
  </footer>
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Footer.astro", void 0);

const $$Skills = createComponent(($$result, $$props, $$slots) => {
  const tabs = [
    {
      tab: "\u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441",
      tags: [
        "JavaScript",
        "React.js",
        "Vue.js",
        "Angular.js",
        "Svelte.js",
        "Ember.js"
      ]
    },
    {
      tab: "\u0411\u044D\u043A\u0435\u043D\u0434",
      tags: [
        "PHP",
        "Laravel",
        "Go",
        "Java"
      ]
    },
    {
      tab: "\u0424\u0440\u0435\u0439\u043C\u0432\u043E\u0440\u043A\u0438",
      tags: [
        "React.js",
        "Vue.js",
        "Angular.js"
      ]
    },
    {
      tab: "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0439",
      tags: [
        "Swift",
        "Dart"
      ]
    },
    {
      tab: "\u0421\u043E\u0444\u0442\u0432\u0435\u0440\u043D\u044B\u0439",
      tags: [
        "C++",
        "C#"
      ]
    }
  ];
  return renderTemplate`${renderComponent($$result, "Container", $$Container, {}, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="skills">
    ${renderComponent($$result2, "Title", $$Title, { "tag": "h2", "text": "\u041A\u0430\u043A\u0438\u0435 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C", "color": "lightblue", "isBlock": true, "hasArrow": true })}

    <div class="skills__tabs">
      <div class="skills__tabs-header">
        ${tabs.map(
    (tab) => renderTemplate`<div class="skills__tabs-tab">
                ${tab.tab}
              </div>`
  )}
      </div>
      <div class="skills__tabs-contents">
        ${tabs.map(
    (tab) => renderTemplate`<div class="skills__tabs-content">
                ${tab.tags.map(
      (tag) => renderTemplate`<div class="skills__tag">
                        ${tag}
                      </div>`
    )}
              </div>`
  )}
      </div>
    </div>
  </div>
` })}



${renderScript($$result, "/home/runner/work/t-studio/t-studio/src/components/Skills.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Skills.astro", void 0);

const GasLogo = new Proxy({"src":"/assets/gas_logo.svg","width":268,"height":63,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/gas_logo.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/gas_logo.svg");
							return target[name];
						}
					});

const AlfaLogo = new Proxy({"src":"/assets/alfa_logo.svg","width":288,"height":37,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/runner/work/t-studio/t-studio/src/assets/alfa_logo.svg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("/home/runner/work/t-studio/t-studio/src/assets/alfa_logo.svg");
							return target[name];
						}
					});

const $$Cases = createComponent(($$result, $$props, $$slots) => {
  const slides = [{
    title: "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0438 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432 \u0434\u043B\u044F \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0439",
    logo: AlfaLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }, {
    title: "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0441\u0430\u0439\u0442-\u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u044F",
    logo: GasLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }, {
    title: "\u0414\u0438\u0437\u0430\u0439\u043D \u0441\u0430\u0439\u0442\u0430",
    logo: AuchanLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }, {
    title: "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0438 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432 \u0434\u043B\u044F \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0439",
    logo: AlfaLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }, {
    title: "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0441\u0430\u0439\u0442-\u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u044F",
    logo: GasLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }, {
    title: "\u0414\u0438\u0437\u0430\u0439\u043D \u0441\u0430\u0439\u0442\u0430",
    logo: AuchanLogo,
    buttonText: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"
  }];
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="cases">
    <div class="cases__header">
      ${renderComponent($$result2, "Title", $$Title, { "text": "\u041D\u0430\u0448\u0438 \u043A\u0435\u0439\u0441\u044B", "tag": "h2" })}
      ${renderComponent($$result2, "Button", $$Button, { "text": "\u041E\u0446\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442" })}

      <div class="cases__navigation">
        <div class="cases__arrow cases__arrow--prev"></div>
        <div class="cases__arrow cases__arrow--next"></div>
      </div>
    </div>

    <div class="cases__body">
      <div class="cases__swiper swiper">
        <div class="cases__wrapper swiper-wrapper">
          ${slides.map(
    (slide) => renderTemplate`<div class="cases__slide swiper-slide">
                <div class="cases__item">
                  <div class="cases__logo">
                    ${renderComponent($$result2, "Image", $$Image, { "src": slide.logo, "alt": "Logo" })}
                  </div>
                  <div class="cases__text">
                    ${slide.title}
                  </div>
                  <button class="cases__button">
                    ${slide.buttonText}
                  </button>
                </div>
              </div>`
  )}
        </div>
      </div>
    </div>
  </div>
` })}



${renderScript($$result, "/home/runner/work/t-studio/t-studio/src/components/Cases.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Cases.astro", void 0);

const $$Astro$1 = createAstro("https://warriorcow.github.io/t-studio/");
const $$InputEl = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$InputEl;
  const {
    class: className,
    type,
    ...rest
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<label class="input">
  <input${addAttribute(["input__el", className], "class:list")}${spreadAttributes(rest)}${addAttribute(type, "type")}>
</label>`;
}, "/home/runner/work/t-studio/t-studio/src/components/UI/InputEl.astro", void 0);

const $$Astro = createAstro("https://warriorcow.github.io/t-studio/");
const $$CheckboxEl = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CheckboxEl;
  const {
    class: className,
    ...rest
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<label class="checkbox">
  <input${addAttribute(["checkbox__el", className], "class:list")}${spreadAttributes(rest)} type="checkbox">
  <span class="checkbox__input"></span>
  <span class="checkbox__text">
    ${renderSlot($$result, $$slots["default"])}
  </span>
</label>`;
}, "/home/runner/work/t-studio/t-studio/src/components/UI/CheckboxEl.astro", void 0);

const $$Form = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Container", $$Container, { "gap": true }, { "default": ($$result2) => renderTemplate`
  ${maybeRenderHead()}<div class="form">
    <div class="form__content">
      ${renderComponent($$result2, "Title", $$Title, { "color": "secondary", "tag": "h2", "text": "\u041F\u043E\u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F \u0441 \u043D\u0430\u043C\u0438", "hasArrow": true, "arrowPosition": "right" })}
      <div class="form__description">
        Оставьте заявку и мы свяжемся с вами в течении одного рабочего дня.
      </div>
    </div>
    <form class="form__inner">
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "\u041A\u0430\u043A \u0412\u0430\u0441 \u0437\u043E\u0432\u0443\u0442? *" })}
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 *" })}
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C *" })}
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "Email *" })}
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 *" })}
      ${renderComponent($$result2, "InputEl", $$InputEl, { "type": "text", "placeholder": "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u043A\u0440\u0430\u0442\u043A\u043E \u0432\u0430\u0448\u0443 \u0437\u0430\u0434\u0430\u0447\u0443 *" })}

      ${renderComponent($$result2, "CheckboxEl", $$CheckboxEl, {}, { "default": ($$result3) => renderTemplate`
        Я даю согласие на обработку персональных данных и согласен с <a href="#">условиями пользовательского соглашения и политики обработки персональных данных.</a>
      ` })}

      ${renderComponent($$result2, "Button", $$Button, { "text": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C" })}
    </form>
  </div>
` })}



${renderScript($$result, "/home/runner/work/t-studio/t-studio/src/components/Form.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/runner/work/t-studio/t-studio/src/components/Form.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate`
  ${renderComponent($$result2, "TopBanner", $$TopBanner, {})}
  ${renderComponent($$result2, "MarqueeSlider", $$MarqueeSlider, {})}
  ${renderComponent($$result2, "Quote", $$Quote, {})}
  ${renderComponent($$result2, "Services", $$Services, {})}
  ${renderComponent($$result2, "Skills", $$Skills, {})}
  ${renderComponent($$result2, "Cases", $$Cases, {})}
  ${renderComponent($$result2, "Work", $$Work, {})}
  ${renderComponent($$result2, "Form", $$Form, {})}
  ${renderComponent($$result2, "Footer", $$Footer, {})}
` })}`;
}, "/home/runner/work/t-studio/t-studio/src/pages/index.astro", void 0);

const $$file = "/home/runner/work/t-studio/t-studio/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page as a, baseService as b, parseQuality as p };
