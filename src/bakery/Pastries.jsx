import { useMemo } from "react";
import { toyPalette as p, SoftBall } from "./ToyPrimitives.jsx";

// A tapered crescent with shallow rolled ridges. The local origin matches existing snack slots.
function crescentSurface() {
  const positions = [],
    indices = [],
    colors = [];
  const sections = 40,
    sides = 12;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections,
      a = -2.22 + t * 4.44;
    const radius =
      (0.022 + Math.pow(Math.sin(t * Math.PI), 0.72) * 0.115) *
      (0.96 + Math.cos(t * Math.PI * 14) * 0.04);
    for (let j = 0; j <= sides; j++) {
      const b = (j / sides) * Math.PI * 2;
      positions.push(
        Math.sin(a) * (0.3 + Math.cos(b) * radius),
        0.015 + Math.sin(b) * radius * 0.87,
        Math.cos(a) * (0.22 + Math.cos(b) * radius),
      );
      const baked = 0.82 + Math.sin(b) * 0.07 + Math.sin(t * Math.PI) * 0.06;
      // Vertex colours are linear, unlike the sRGB hex colours used by the other materials.
      colors.push(baked * 0.68, baked * 0.3, baked * 0.085);
      if (i < sections && j < sides) {
        const n = i * (sides + 1) + j;
        indices.push(
          n,
          n + sides + 1,
          n + 1,
          n + 1,
          n + sides + 1,
          n + sides + 2,
        );
      }
    }
  }
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
  };
}

export function Bread({ position, scale = 1, onClick, selected }) {
  return (
    <group position={position} scale={scale} onClick={onClick}>
      <SoftBall color={p.bread} size={0.4} scale={[1, 0.43, 0.67]} />
      <SoftBall
        color={p.dough}
        size={0.35}
        scale={[1, 0.27, 0.64]}
        position={[0, 0.06, 0]}
      />
      {[-0.2, 0, 0.2].map((x) => (
        <group key={x} position={[x, 0.13, 0]} rotation={[0, 0.18, -0.25]}>
          <SoftBall color="#a7693e" size={0.08} scale={[0.33, 0.25, 2.15]} />
          <SoftBall
            color="#ffe1a7"
            size={0.08}
            scale={[0.22, 0.2, 2.05]}
            position={[0.016, 0.009, 0]}
          />
        </group>
      ))}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
          <torusGeometry args={[0.43, 0.02, 6, 28]} />
          <meshBasicMaterial color="#e0a13b" />
        </mesh>
      )}
    </group>
  );
}

export function Croissant({ position, onClick, selected }) {
  const surface = useMemo(crescentSurface, []);
  return (
    <group position={position} onClick={onClick}>
      <mesh castShadow receiveShadow>
        <bufferGeometry
          onUpdate={(geometry) => geometry.computeVertexNormals()}
        >
          <bufferAttribute
            attach="attributes-position"
            args={[surface.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[surface.colors, 3]}
          />
          <bufferAttribute attach="index" args={[surface.indices, 1]} />
        </bufferGeometry>
        <meshStandardMaterial vertexColors roughness={0.82} />
      </mesh>
      {[-1.65, -1.1, -0.55, 0, 0.55, 1.1, 1.65].map((a) => {
        const t = (a + 2.22) / 4.44,
          radius = 0.022 + Math.pow(Math.sin(t * Math.PI), 0.72) * 0.115;
        return (
          <mesh
            key={a}
            position={[Math.sin(a) * 0.3, 0.015, Math.cos(a) * 0.22]}
            rotation={[0, Math.PI / 2 + a, 0]}
            scale={[1, 0.87, 1]}
          >
            <torusGeometry args={[radius, 0.006, 5, 14]} />
            <meshStandardMaterial color="#f2c486" roughness={0.9} />
          </mesh>
        );
      })}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
          <torusGeometry args={[0.44, 0.02, 6, 28]} />
          <meshBasicMaterial color="#e0a13b" />
        </mesh>
      )}
    </group>
  );
}
