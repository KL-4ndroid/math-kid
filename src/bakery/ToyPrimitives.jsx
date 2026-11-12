import { RoundedBox as DreiRoundedBox } from "@react-three/drei";

export const toyPalette = Object.freeze({
  cream: "#fff0d2",
  dough: "#efc783",
  bread: "#cc8b4d",
  crust: "#925a39",
  wood: "#b18461",
  darkWood: "#825c43",
  sage: "#8da891",
  linen: "#f3e5cc",
  orange: "#da8750",
  orangeLight: "#e9a365",
  cocoa: "#463a35",
  rose: "#d59a98",
});

export function RoundedBox({
  position,
  scale,
  color,
  radius = 0.12,
  roughness = 0.84,
  ...props
}) {
  return (
    <DreiRoundedBox
      position={position}
      args={scale}
      radius={radius}
      smoothness={3}
      castShadow
      receiveShadow
      {...props}
    >
      <meshStandardMaterial color={color} roughness={roughness} />
    </DreiRoundedBox>
  );
}

export function SoftBall({ color, size = 1, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[size, 20, 14]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

export function BakeryLighting({ overview = false }) {
  return (
    <>
      <hemisphereLight color="#fff5dc" groundColor="#b29c86" intensity={1.05} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-3, 8, 5]}
        color="#fff2d7"
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      <directionalLight
        position={[5, 4, -3]}
        color="#dceae5"
        intensity={0.85}
      />
      {overview && <fog attach="fog" args={["#ecebdc", 23, 44]} />}
    </>
  );
}
