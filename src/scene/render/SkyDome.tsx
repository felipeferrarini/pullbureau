'use client'

import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { SkyLook } from '@/types/outside'
import { BackSide, Color, type Mesh, ShaderMaterial, Vector3 } from 'three'
import { useSkyLook } from './SkyContext'

const RADIUS = 420
const MOON_COLOR = '#dfe8ff'

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
  gl_Position.z = gl_Position.w;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 ground;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float night;
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  vec3 sky = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.5));
  vec3 color = mix(sky, ground, smoothstep(0.0, -0.08, h));
  float d = max(dot(dir, normalize(sunDir)), 0.0);
  float disc = smoothstep(mix(0.9994, 0.9996, night), mix(0.9997, 0.9998, night), d);
  float halo = pow(d, mix(10.0, 60.0, night)) * mix(0.35, 0.18, night);
  color += sunColor * (disc * mix(6.0, 2.2, night) + halo) * step(-0.02, h);
  gl_FragColor = vec4(color, 1.0);
}
`

function createSkyMaterial(look: SkyLook) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new Color(look.zenith) },
      horizon: { value: new Color(look.horizon) },
      ground: { value: new Color(look.fog) },
      sunColor: { value: new Color(look.night ? MOON_COLOR : look.sunColor) },
      sunDir: { value: new Vector3(...look.sunDirection) },
      night: { value: look.night ? 1 : 0 },
    },
  })
}

export function SkyDome() {
  const look = useSkyLook()
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => createSkyMaterial(look), [look])
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position))

  return (
    <>
      <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[RADIUS, 32, 16]} />
      </mesh>
      {look.stars > 0.3 && <Stars radius={160} depth={80} count={Math.round(2600 * look.stars)} factor={5} saturation={0.1} fade speed={0.4} />}
      <fog attach="fog" args={[look.fog, 85, 260]} />
      <color attach="background" args={[look.horizon]} />
    </>
  )
}
