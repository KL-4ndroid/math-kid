import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { isVoiceActive } from "../utils/sound.js";
import { RoundedBox, SoftBall, toyPalette as p } from "./ToyPrimitives.jsx";

export function Fox({
  position = [-2.5, 0, 3.1],
  scale = 1,
  onClick,
  happy = false,
  quiet = false,
  guiding = false,
}) {
  const root = useRef(),
    head = useRef(),
    eyes = useRef(),
    tail = useRef(),
    leftPaw = useRef(),
    rightPaw = useRef(),
    mouth = useRef();
  const cheer = useRef(2);
  const [speaking, setSpeaking] = useState(isVoiceActive);
  useEffect(() => {
    const sync = () => setSpeaking(isVoiceActive());
    window.addEventListener("magic-math-voice", sync);
    sync();
    return () => window.removeEventListener("magic-math-voice", sync);
  }, []);
  useEffect(() => {
    if (happy) cheer.current = 0;
  }, [happy]);
  useFrame(({ clock }, delta) => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    cheer.current += delta;
    const celebrating = happy && cheer.current < 1.1 && !quiet && !reduced;
    if (root.current)
      root.current.position.y =
        position[1] +
        (reduced || quiet
          ? 0
          : celebrating
            ? Math.abs(Math.sin((cheer.current * Math.PI * 2) / 1.1)) * 0.11
            : Math.sin(clock.elapsedTime * 1.6) * 0.009);
    if (head.current)
      head.current.rotation.z =
        quiet || reduced
          ? 0
          : guiding
            ? -0.08
            : Math.sin(clock.elapsedTime * 1.1) * 0.015;
    if (eyes.current)
      eyes.current.scale.y = !reduced && clock.elapsedTime % 6 > 5.8 ? 0.12 : 1;
    if (tail.current)
      tail.current.rotation.z =
        -0.38 +
        (quiet || reduced ? 0 : Math.sin(clock.elapsedTime * 1.8) * 0.09);
    if (leftPaw.current)
      leftPaw.current.rotation.z = celebrating
        ? -1.5 + Math.sin(cheer.current * 12) * 0.15
        : guiding
          ? -1.05
          : -0.2;
    if (rightPaw.current) rightPaw.current.rotation.z = celebrating ? 1.5 : 0.2;
    if (mouth.current)
      mouth.current.scale.y =
        speaking && !quiet
          ? reduced
            ? 1
            : 0.8 + Math.abs(Math.sin(clock.elapsedTime * 12)) * 1.3
          : 0.45;
  });
  return (
    <group ref={root} position={position} scale={scale} onClick={onClick}>
      <group ref={tail} position={[0.36, 0.5, -0.13]} rotation={[0, 0, -0.38]}>
        <SoftBall
          color={p.orange}
          size={0.32}
          scale={[0.85, 1.55, 0.82]}
          position={[0.18, 0.12, 0]}
        />
        <SoftBall
          color={p.cream}
          size={0.22}
          scale={[1, 0.95, 1]}
          position={[0.22, 0.44, 0.025]}
        />
      </group>
      <SoftBall
        color={p.orange}
        size={0.36}
        scale={[1, 1.25, 0.8]}
        position={[0, 0.61, 0]}
      />
      {[-0.2, 0.2].map((x) => (
        <SoftBall
          key={x}
          color={p.darkWood}
          size={0.17}
          scale={[0.85, 0.62, 1.2]}
          position={[x, 0.13, 0.13]}
        />
      ))}
      <RoundedBox
        position={[0, 0.64, 0.27]}
        scale={[0.5, 0.61, 0.085]}
        radius={0.06}
        color={p.sage}
      />
      <RoundedBox
        position={[0, 0.52, 0.33]}
        scale={[0.3, 0.18, 0.04]}
        radius={0.035}
        color="#aec2a3"
      />
      {[-0.17, 0.17].map((x) => (
        <SoftBall
          key={x}
          position={[x, 0.86, 0.33]}
          size={0.035}
          color="#e8d2a0"
        />
      ))}
      <group ref={leftPaw} position={[-0.32, 0.82, 0.02]}>
        <SoftBall
          position={[-0.04, -0.17, 0.01]}
          color={p.orangeLight}
          size={0.14}
          scale={[0.8, 1.7, 0.9]}
        />
        <SoftBall
          color={p.cream}
          size={0.095}
          position={[-0.045, -0.32, 0.03]}
        />
      </group>
      <group ref={rightPaw} position={[0.32, 0.82, 0.02]}>
        <SoftBall
          position={[0.04, -0.17, 0.01]}
          color={p.orangeLight}
          size={0.14}
          scale={[0.8, 1.7, 0.9]}
        />
        <SoftBall
          color={p.cream}
          size={0.095}
          position={[0.045, -0.32, 0.03]}
        />
      </group>
      <group ref={head} position={[0, 1.24, 0.04]}>
        <SoftBall color={p.orange} size={0.43} scale={[1.12, 0.9, 0.9]} />
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.29, 0.3, -0.03]}
            rotation={[0, 0, -side * 0.18]}
          >
            <mesh castShadow>
              <coneGeometry args={[0.19, 0.48, 4]} />
              <meshStandardMaterial color={p.orange} roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.025, 0.085]} scale={[0.63, 0.65, 0.4]}>
              <coneGeometry args={[0.19, 0.48, 4]} />
              <meshStandardMaterial color="#825443" roughness={0.9} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((side) => (
          <SoftBall
            key={side}
            color={p.cream}
            size={0.23}
            scale={[1.1, 0.68, 0.75]}
            position={[side * 0.2, -0.1, 0.29]}
            rotation={[0, 0, side * 0.24]}
          />
        ))}
        <group ref={eyes} position={[0, 0.055, 0.355]}>
          {[-0.17, 0.17].map((x) => (
            <group key={x}>
              <SoftBall
                color={p.cocoa}
                size={0.046}
                position={[x, 0, 0]}
                scale={[0.85, 1.3, 0.6]}
              />
              <SoftBall
                color="#fffdf3"
                size={0.012}
                position={[x - 0.009, 0.016, 0.025]}
              />
            </group>
          ))}
        </group>
        <SoftBall
          color={p.cream}
          size={0.15}
          position={[0, -0.13, 0.39]}
          scale={[1.1, 0.7, 0.85]}
        />
        <SoftBall
          color={p.cocoa}
          size={0.068}
          position={[0, -0.08, 0.51]}
          scale={[1.1, 0.65, 0.8]}
        />
        <mesh ref={mouth} position={[0, -0.22, 0.455]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color="#7f493d" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
