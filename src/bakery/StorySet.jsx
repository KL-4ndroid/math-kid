import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "./ToyPrimitives.jsx";

function Ball({ color, size = 0.2, ...props }) {
  return (
    <mesh castShadow {...props}>
      <sphereGeometry args={[size, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

export function Friend({ kind, position, happy = false }) {
  const root = useRef();
  const ears = useRef();
  useFrame(({ clock }) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (root.current)
      root.current.position.y =
        position[1] +
        Math.sin(clock.elapsedTime * (happy ? 5 : 1.8)) *
          (happy ? 0.08 : 0.018);
    if (ears.current)
      ears.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.05;
  });
  const bird = kind === "bird";
  const color = kind === "rabbit" ? "#f1ddca" : bird ? "#8eb8be" : "#bd936b";
  return (
    <group position={position} ref={root} scale={bird ? 0.85 : 1}>
      <Ball
        position={[0, 0.6, 0]}
        size={0.42}
        color={color}
        scale={[1, 1.15, 0.9]}
      />
      <Ball position={[0, 1.12, 0]} size={0.4} color={color} />
      <group ref={ears}>
        {!bird &&
          [-0.25, 0.25].map((x) => (
            <group key={x} position={[x, kind === "rabbit" ? 1.68 : 1.43, 0]}>
              <Ball
                color={color}
                size={kind === "rabbit" ? 0.14 : 0.18}
                scale={kind === "rabbit" ? [1, 2.7, 0.7] : [1, 1, 0.6]}
              />
              <Ball
                position={[0, 0, 0.09]}
                color="#d7afa0"
                size={0.09}
                scale={kind === "rabbit" ? [0.75, 3, 0.4] : [1, 1, 0.35]}
              />
            </group>
          ))}
      </group>
      {!bird && (
        <Ball
          position={[0, 1, 0.32]}
          color="#fff0d6"
          size={0.18}
          scale={[1.2, 0.8, 0.8]}
        />
      )}
      {[-0.14, 0.14].map((x) => (
        <Ball key={x} position={[x, 1.17, 0.36]} color="#46382f" size={0.04} />
      ))}
      {bird ? (
        <mesh position={[0, 1.08, 0.43]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.22, 5]} />
          <meshStandardMaterial color="#e3b65e" />
        </mesh>
      ) : (
        <Ball position={[0, 1.04, 0.48]} color="#90655a" size={0.045} />
      )}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball
            color={color}
            position={[s * 0.42, 0.69, 0.05]}
            size={bird ? 0.22 : 0.16}
            scale={bird ? [0.6, 1, 0.6] : [0.8, 1.5, 1]}
            rotation={[0, 0, s * (happy ? 0.8 : 0.2)]}
          />
          <Ball
            color={bird ? "#d9ad5e" : color}
            position={[s * 0.2, 0.13, 0.16]}
            size={0.15}
            scale={[1, 0.65, 1.5]}
          />
        </group>
      ))}
      {!bird && (
        <RoundedBox
          position={[0, 0.83, 0.32]}
          scale={[0.55, 0.14, 0.12]}
          radius={0.05}
          color={kind === "rabbit" ? "#e2ac9c" : "#8ba6a2"}
        />
      )}
    </group>
  );
}

export function Oven({ position, open = true }) {
  const door = useRef();
  useFrame((_, delta) => {
    if (!door.current) return;
    const target = open ? -1.15 : 0;
    door.current.rotation.x = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? target
      : target + (door.current.rotation.x - target) * Math.exp(-delta * 6);
  });
  return (
    <group position={position}>
      <RoundedBox scale={[2, 1.7, 1.25]} radius={0.14} color="#b6c4b7" />
      <RoundedBox
        position={[0, 0, 0.65]}
        scale={[1.65, 1.1, 0.08]}
        radius={0.03}
        color="#534639"
      />
      <RoundedBox
        position={[0, -0.3, 0.72]}
        scale={[1.4, 0.07, 0.7]}
        radius={0.03}
        color="#b3a18a"
      />
      <mesh position={[0, 0.3, 0.66]}>
        <boxGeometry args={[1.2, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#eac177"
          emissive="#db9845"
          emissiveIntensity={0.6}
        />
      </mesh>
      <group ref={door} position={[0, -0.65, 0.7]}>
        <RoundedBox
          position={[0, 0.45, 0]}
          scale={[1.8, 1, 0.12]}
          radius={0.04}
          color="#e7dcc9"
        />
        <RoundedBox
          position={[0, 0.45, 0.08]}
          scale={[1.3, 0.6, 0.08]}
          radius={0.03}
          color="#716b61"
        />
        <RoundedBox
          position={[0, 0.82, 0.15]}
          scale={[1.2, 0.08, 0.1]}
          radius={0.025}
          color="#9a7960"
        />
      </group>
      {[-0.55, 0, 0.55].map((x) => (
        <Ball key={x} color="#f1dfbb" size={0.09} position={[x, 0.65, 0.67]} />
      ))}
    </group>
  );
}

export function PaperBag({ position }) {
  return (
    <group position={position}>
      <RoundedBox scale={[1.25, 0.13, 1]} color="#c8a67c" radius={0.04} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox
            position={[s * 0.6, 0.45, 0]}
            scale={[0.08, 0.9, 1]}
            color="#d8b88d"
            radius={0.025}
          />
          <RoundedBox
            position={[0, 0.45, s * 0.46]}
            scale={[1.2, 0.9, 0.08]}
            color="#e8c89d"
            radius={0.025}
          />
          <mesh position={[0, 1.05, s * 0.46]}>
            <torusGeometry args={[0.28, 0.035, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#a47e55" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function StorySet({
  scene = "kitchen",
  moved = 0,
  quiet = false,
  ovenOpen = true,
}) {
  const outdoors = ["picnic", "garden", "celebration"].includes(scene);
  return (
    <group>
      <RoundedBox
        position={[0, -0.22, 0]}
        scale={[12, 0.35, 8]}
        radius={0.15}
        color={outdoors ? "#afc49b" : "#e3cfad"}
      />
      {scene === "kitchen" && (
        <>
          <RoundedBox
            position={[0, 1.4, -3.65]}
            scale={[10, 3.2, 0.25]}
            color="#e7ddc6"
            radius={0.1}
          />
          <RoundedBox
            position={[0, 0.22, -3.46]}
            scale={[10, 0.45, 0.15]}
            color="#b9c6ab"
            radius={0.04}
          />
          <group position={[1.1, 1.75, -3.48]}>
            <RoundedBox scale={[2.7, 1.9, 0.17]} color="#b39370" radius={0.1} />
            <RoundedBox
              position={[0, 0, 0.11]}
              scale={[2.44, 1.62, 0.08]}
              color="#c7ded0"
              radius={0.05}
            />
            <RoundedBox
              position={[0, 0, 0.18]}
              scale={[0.07, 1.65, 0.055]}
              color="#f4e7c9"
              radius={0.02}
            />
            <RoundedBox
              position={[0, 0, 0.18]}
              scale={[2.45, 0.07, 0.055]}
              color="#f4e7c9"
              radius={0.02}
            />
          </group>
          <Oven position={[-2.3, 1.1, -2.8]} open={ovenOpen} />
          <RoundedBox
            position={[1.2, 0.8, -2.9]}
            scale={[3, 0.14, 0.75]}
            color="#ae8963"
          />
          {[-0.15, 2.55].map((x) => (
            <RoundedBox
              key={x}
              position={[x, 0.45, -2.9]}
              scale={[0.12, 0.8, 0.6]}
              color="#c8b091"
              radius={0.035}
            />
          ))}
        </>
      )}
      {scene === "counter" && (
        <>
          <Friend
            kind="rabbit"
            position={[2.8, 0, -2]}
            happy={!quiet && moved > 0}
          />
          <PaperBag position={[3.2, 0.4, -0.8]} />
        </>
      )}
      {scene === "picnic" && (
        <>
          <Friend
            kind="bear"
            position={[2.8, 0, -2]}
            happy={!quiet && moved > 0}
          />
          <RoundedBox
            position={[0, 0.02, -0.5]}
            scale={[8.5, 0.04, 5]}
            radius={0.02}
            color="#e6bd9a"
          />
          {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
            <RoundedBox
              key={x}
              position={[x, 0.05, -0.5]}
              scale={[0.42, 0.025, 5]}
              radius={0.01}
              color="#f5e5c7"
            />
          ))}
        </>
      )}
      {(scene === "garden" || scene === "celebration") && (
        <>
          <Friend
            kind="bird"
            position={[2.8, 0.8, -2]}
            happy={!quiet && moved > 0}
          />
          {[-4, 4].map((x) => (
            <group key={x} position={[x, 0.2, -2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.35, 0.6, 16]} />
                <meshStandardMaterial color="#d09a7b" />
              </mesh>
              {[-0.2, 0.15].map((dx, i) => (
                <group key={i} position={[dx, 0.8, 0]}>
                  <RoundedBox
                    scale={[0.04, 1, 0.04]}
                    color="#6c9461"
                    radius={0.015}
                  />
                  <Ball
                    color={i ? "#e8bc68" : "#db969e"}
                    size={0.23}
                    position={[0, 0.5, 0]}
                  />
                </group>
              ))}
            </group>
          ))}
          {scene === "celebration" && (
            <>
              <Friend kind="rabbit" position={[1.3, 0, -2.5]} happy />
              <Friend kind="bear" position={[-0.2, 0, -2.5]} happy />
              <pointLight
                position={[0, 4, 0]}
                color="#ffdda0"
                intensity={15}
                distance={12}
              />
              {Array.from({ length: 9 }, (_, i) => (
                <Ball
                  key={i}
                  position={[-4 + i, 3.4, -3]}
                  size={0.09}
                  color="#ffe19c"
                />
              ))}
            </>
          )}
        </>
      )}
    </group>
  );
}
