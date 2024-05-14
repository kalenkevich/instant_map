import { createCanvasEl } from '../../map/renderer/webgl/webgl_renderer';
import { createRootEl } from '../demo_utils';
import { createProgram } from '../../map/renderer/webgl/helpers/webgl_program';
import { createWebGlUniform } from '../../map/renderer/webgl/helpers/weblg_uniform';
import { createWebGlBuffer } from '../../map/renderer/webgl/helpers/webgl_buffer';
import { createWebGlTexture } from '../../map/renderer/webgl/helpers/weblg_texture';
import { createObjectPropertiesTexture } from '../../map/renderer/webgl/helpers/object_properties_texture';
import { VERTEX_QUAD_POSITION } from '../../map/renderer/webgl/objects/object/object_group_builder';
import { addXTimes } from '../../map/renderer/webgl/utils/array_utils';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number, number];
}

const VERTEX_SHADER_SOURCE = `#version 300 es
  precision highp float;
  #define VERTEX_QUAD_ALIGNMENT_TOP_LEFT 0.0
  #define VERTEX_QUAD_ALIGNMENT_TOP_RIGHT 1.0
  #define VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT 2.0
  #define VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT 3.0

  uniform vec3 u_properties_data;
  uniform sampler2D u_properties;

  layout (location=0) in vec3 a_position;
  layout (location=1) in float a_object_index;

  out vec4 v_color;

  vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
    float col = mod(index, texSize.x);
    float row = floor(index / texSize.x);

    return texelFetch(tex, ivec2(col, row), 0);
  }

  void main() {
    vec4 obj_properties = getValueByIndexFromTexture(u_properties, u_properties_data.xy, a_object_index * 2.0);
    v_color = getValueByIndexFromTexture(u_properties, u_properties_data.xy, a_object_index * 2.0 + 1.0);
    float width = obj_properties[0];
    float height = obj_properties[1];
    float offsetTop = obj_properties[2];
    float offsetLeft = obj_properties[3];

    float x = a_position.x + offsetLeft;
    float y = a_position.y - offsetTop;
    float alignment = a_position.z;

    if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_RIGHT) {
      x += width;
    } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT) {
      y += height;
    } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT) {
      x += width;
      y += height;
    }

    gl_Position = vec4(x, y, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
  precision highp float;

  in vec4 v_color;
  out vec4 outputColor;

  void main() {
    outputColor = v_color;
  }
`;

export function renderTexturePropertiesExample() {
  const rootEl = createRootEl();
  const canvasEl = createCanvasEl(rootEl, window.devicePixelRatio);
  rootEl.appendChild(canvasEl);
  const gl = canvasEl.getContext('webgl2', {
    performance: 'high-performance',
    alpha: true,
    antialias: true,
  }) as WebGL2RenderingContext;
  gl.viewport(0, 0, canvasEl.width, canvasEl.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

  const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
  const vao = gl.createVertexArray();
  gl.useProgram(program);

  const propertiesDataUniform = createWebGlUniform(gl, { name: 'u_properties_data', program });
  const propertiesDataTextureUniform = createWebGlUniform(gl, { name: 'u_properties', program });
  const propertiesDataTexture = createWebGlTexture(gl, {
    name: 'text_properties_texture',
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    // Not texture filterable means they must be used with gl.NEAREST only
    minFilter: gl.NEAREST,
    magFilter: gl.NEAREST,
    // Be careful with this config. This one only for Float32 texture source.
    // Сheck more options and combinations here: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D#internalformat
    type: gl.FLOAT,
    internalFormat: gl.RGBA32F,
    format: gl.RGBA,
  });

  gl.bindVertexArray(vao);
  const positionBuffer = createWebGlBuffer(gl, { location: 0, size: 3 });
  const objectIndexBuffer = createWebGlBuffer(gl, { location: 1, size: 1 });
  gl.bindVertexArray(null);

  const data = createRectanglesRenderData(generateRectangles(100000));

  gl.bindVertexArray(vao);
  propertiesDataTexture.bind();

  propertiesDataTexture.setPixels(data.properties.texture);
  propertiesDataUniform.setVector3([
    data.properties.texture.width,
    data.properties.texture.height,
    data.properties.sizeInPixels,
  ]);
  propertiesDataTextureUniform.setInteger(propertiesDataTexture.index);

  positionBuffer.bufferData(data.positionBuffer);
  objectIndexBuffer.bufferData(data.objectIndexBuffer);

  gl.drawArrays(gl.TRIANGLES, 0, data.numElements);

  console.log(data.properties);

  propertiesDataTexture.unbind();
  gl.bindVertexArray(null);

  const glError = gl.getError();
  if (glError) {
    console.log(glError);
  }
}

function createRectanglesRenderData(rectangles: Rectangle[]) {
  let numElements = 0;
  const propertiesTextureObj = createObjectPropertiesTexture();
  const positions: number[] = [];
  const index: number[] = [];

  let currentIndex = 0;
  for (const rect of rectangles) {
    positions.push(
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.TOP_LEFT,
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.TOP_RIGHT,
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.TOP_RIGHT,
      rect.x,
      rect.y,
      VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
    );
    addXTimes(index, currentIndex, 6);
    propertiesTextureObj.addValue([rect.width, rect.height, 0, 0]);
    propertiesTextureObj.addValue(rect.color);

    currentIndex += 1;
    numElements += 6;
  }

  return {
    positionBuffer: new Float32Array(positions),
    objectIndexBuffer: new Float32Array(index),
    numElements,
    properties: {
      texture: propertiesTextureObj.compileTexture(),
      sizeInPixels: 2,
    },
  };
}

function generateRectangles(n = 1000): Rectangle[] {
  const result: Rectangle[] = [];

  for (let i = 0; i < n; i++) {
    result.push({
      x: getRandomValue(-1, 1),
      y: getRandomValue(-1, 1),
      width: getRandomValue(0, 1),
      height: getRandomValue(0, 1),
      color: [getRandomValue(0, 1), getRandomValue(0, 1), getRandomValue(0, 1), 1.0],
    });
  }

  return result;
}

function getRandomValue(from: number, to: number): number {
  return Math.random() * (from - to) + to;
}
