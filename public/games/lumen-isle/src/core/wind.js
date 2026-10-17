import { Vector3 } from 'three';

/**
 * Wind and water motion run on the GPU: materials are patched to read a shared time uniform,
 * so thousands of grass blades, leaves and waves move without any per-frame JavaScript.
 */

export const sharedUniforms = { uTime: { value: 0 }, uCameraPos: { value: new Vector3() } };

// Screen-door fade for fragments right next to the camera, so tree crowns never fill the view.
const FADE_VERTEX = `
  #ifdef USE_INSTANCING
    vFadeWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vFadeWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`;
const FADE_FRAGMENT = `
  float fadeDistance = distance(vFadeWorld, uCameraPos);
  if (fadeDistance < 4.0) {
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    if (noise > (fadeDistance - 1.5) / 2.5) discard;
  }`;

/**
 * Sway instanced meshes. Vertices bend more the higher they are above the instance origin.
 * @param {import('three').Material} material
 * @param {{ strength?: number, speed?: number, fadeNearCamera?: boolean }} options
 */
export function addWindSway(material, { strength = 0.05, speed = 1, fadeNearCamera = false } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    if (fadeNearCamera) {
      shader.uniforms.uCameraPos = sharedUniforms.uCameraPos;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vFadeWorld;')
        .replace('#include <project_vertex>', `#include <project_vertex>${FADE_VERTEX}`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uCameraPos;\nvarying vec3 vFadeWorld;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>${FADE_FRAGMENT}`);
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 rootXZ = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        #else
          vec2 rootXZ = vec2(0.0);
        #endif
        float bend = max(position.y, 0.0) * ${strength.toFixed(4)};
        float t = uTime * ${speed.toFixed(3)};
        transformed.x += sin(t * 0.8 + rootXZ.x * 0.15 + rootXZ.y * 0.07) * bend;
        transformed.z += cos(t * 0.6 + rootXZ.y * 0.13) * bend * 0.7;`,
      );
  };
  material.customProgramCacheKey = () => `wind-${strength}-${speed}-${fadeNearCamera}`;
}

/** Rolling ocean swell computed in the vertex shader. Flat shading derives normals per pixel. */
export function addOceanWaves(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec2 p = position.xz;
        transformed.y += sin(p.x * 0.09 + uTime * 0.7) * 0.14 + cos(p.y * 0.11 + uTime * 0.55) * 0.14
                       + sin((p.x + p.y) * 0.2 + uTime * 1.1) * 0.05;`,
      );
  };
  material.customProgramCacheKey = () => 'ocean-waves';
}
