import { mat3 } from 'gl-matrix';
import { WebGlText } from '../text/text';
import { WebGlTextSdfBufferredGroup } from './text_sdf';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { Projection } from '../../../../geo/projection/projection';
import { MapFeatureFlags } from '../../../../flags';
import { FontManager } from '../../../../font/font_manager';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { MapTileFeatureType } from '../../../../tile/tile';

export class TextSdfGroupBuilder extends ObjectGroupBuilder<WebGlText> {
  constructor(
    protected readonly projectionViewMat: mat3,
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly pixelRatio: number,
    protected readonly zoom: number,
    protected readonly minZoom: number,
    protected readonly maxZoom: number,
    protected readonly tileSize: number,
    protected readonly projection: Projection,
    protected readonly featureFlags: MapFeatureFlags,
    private readonly fontManager: FontManager
  ) {
    super(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      pixelRatio,
      zoom,
      minZoom,
      maxZoom,
      tileSize,
      projection,
      featureFlags
    );
  }

  addObject(text: WebGlText): void {
    if (!text.text || text.text === ' ') {
      return;
    }

    this.objects.push([text, 0]);
  }

  build(): WebGlTextSdfBufferredGroup {
    return {
      type: MapTileFeatureType.text,
      size: 0,
      numElements: 0,
      texture: null,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer([]),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer([]),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer([]),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer([]),
      },
    };
  }
}
