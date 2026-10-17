import * as THREE from 'three';

/** One shared soft radial texture for every glow, halo and spark. */
export const GLOW_TEXTURE = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
})();

/** Additive glow sprite material. Each sprite that fades independently needs its own material. */
export function glowMaterial(color, opacity = 1) {
  return new THREE.SpriteMaterial({
    map: GLOW_TEXTURE, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

export function glowSprite(color, opacity, scale) {
  const sprite = new THREE.Sprite(glowMaterial(color, opacity));
  sprite.scale.setScalar(scale);
  return sprite;
}
