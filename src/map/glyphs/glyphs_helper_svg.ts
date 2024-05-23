import { XMLParser } from 'fast-xml-parser';
import {
  SvgGlyphsTextureAtlasConfig,
  TextureAtlasState,
  GlyphTextureAtlasMapping,
  GlyphsTextrureAtlasType,
} from './glyphs_config';
import { ImageBitmapTextureSource } from '../texture/texture';
import { downloadBitmapImage } from '../utils/download_utils';
import { imageToImageBitmapTextureSource } from '../texture/texture_utils';

interface XmlRowSvg {
  '@_xmlns': string;
  '@_width': string;
  '@_height': string;
  '@_viewBox': string;
  svg: XmlRowGlyph[];
  view: XmlRowView[];
}

interface XmlRowView {
  '@_id': string;
  '@_viewBox': string;
}

interface XmlRowPath {
  '@_d': string;
}

interface XmlRowGlyph {
  '@_xmlns': string;
  '@_version': string;
  '@_baseProfile': string;
  '@_viewBox': string;
  '@_overflow': string;
  '@_width': string;
  '@_height': string;
  path: XmlRowPath | XmlRowPath[];
}

export async function getGlyphTextureAtlasFromSvgConfig(
  config: SvgGlyphsTextureAtlasConfig,
  debugMode: boolean = false,
): Promise<TextureAtlasState> {
  const xmlSource = await fetch(config.sourceUrl).then(r => r.text());
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsedXmlData = parser.parse(xmlSource);
  const xmlRowSvg = parsedXmlData['svg'] as XmlRowSvg;
  const glyphsMapping: Record<string, GlyphTextureAtlasMapping> = {};
  const path = new Path2D();
  const pixelRatio = config.pixelRatio || 1;

  for (let i = 0; i < xmlRowSvg.svg.length; i++) {
    const view = xmlRowSvg.view[i];
    const svg = xmlRowSvg.svg[i];
    const [x1, y1] = view['@_viewBox'].split(' ').map(i => parseInt(i) * pixelRatio);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_x, _y, viewWidth, viewHeight] = (svg['@_viewBox'] || '').split(' ').map(i => parseInt(i));
    const svgWidth = parseInt(svg['@_width']) * pixelRatio;
    const svgHeight = parseInt(svg['@_height']) * pixelRatio;

    glyphsMapping[view['@_id']] = {
      name: view['@_id'],
      x: x1,
      y: y1,
      width: svgWidth,
      height: svgHeight,
      visible: true,
      pixelRatio,
    };

    const transform = new DOMMatrix();
    transform.translateSelf(x1, y1, 0);
    if (viewWidth && viewHeight) {
      transform.scaleSelf(svgWidth / viewWidth, svgHeight / viewHeight);
    }
    if (Array.isArray(svg['path'])) {
      for (const p of svg['path']) {
        path.addPath(new Path2D(p['@_d']), transform);
      }
    } else {
      path.addPath(new Path2D(svg['path']['@_d']), transform);
    }
  }

  const width = parseInt(xmlRowSvg['@_width']) * pixelRatio;
  const height = parseInt(xmlRowSvg['@_height']) * pixelRatio;
  const offscreenCanvas = new OffscreenCanvas(width, height);
  const source = await getTextureSourceFromGlyphPath(offscreenCanvas, path, debugMode);

  return {
    type: GlyphsTextrureAtlasType.svg,
    name: config.name,
    width,
    height,
    source,
    mapping: glyphsMapping,
  };
}

async function getTextureSourceFromGlyphPath(
  canvas: OffscreenCanvas,
  path: Path2D,
  debugMode: boolean = false,
): Promise<ImageBitmapTextureSource> {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fill(path);

  if (debugMode) {
    const bitmapImage = await createImageBitmap(canvas, 0, 0, canvas.width, canvas.height, {
      premultiplyAlpha: 'premultiply',
    });
    await downloadBitmapImage(bitmapImage);
  }

  return imageToImageBitmapTextureSource(canvas, 0, 0, canvas.width, canvas.height);
}
