import { WebGlObjectBufferredGroup } from '../object/object';
import { MapFeatureFlags } from '../../../../flags';
import TextSdfShaders from './text_sdf_shaders';
import { DrawObjectGroupOptions, ObjectProgram } from '../object/object_program';
import { ExtendedWebGLRenderingContext } from '../../webgl_context';

export class TextSdfProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly vertexShaderSource: string = TextSdfShaders.vertext,
    protected readonly fragmentShaderSource: string = TextSdfShaders.fragment
  ) {
    super(gl, featureFlags, vertexShaderSource, fragmentShaderSource);
  }

  public async onInit(): Promise<void> {}

  onLink(): void {}

  onUnlink(): void {}

  drawObjectGroup(objectGroup: WebGlObjectBufferredGroup, options?: DrawObjectGroupOptions): void {}
}
