import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Plane, Vector3, Shape } from "three";
import { OrbitControls } from "@react-three/drei";
import { Snack, Tray, slotPosition } from "./SnackModels.jsx";

import {
  RoundedBox,
  BakeryLighting,
  toyPalette as palette,
} from "./ToyPrimitives.jsx";
import { Bread, Croissant } from "./Pastries.jsx";
import { Fox } from "./FoxModel.jsx";
export { RoundedBox } from "./ToyPrimitives.jsx";
export { Bread, Croissant } from "./Pastries.jsx";
export { Fox } from "./FoxModel.jsx";

function RoofGable() {
  const outline = useMemo(
    () =>
      new Shape().moveTo(-3.4, 0).lineTo(3.4, 0).lineTo(0, 1.05).closePath(),
    [],
  );
  return (
    <mesh position={[0, 3.65, -1.9]} castShadow receiveShadow>
      <extrudeGeometry args={[outline, { depth: 3.8, bevelEnabled: false }]} />
      <meshStandardMaterial color="#f5e2c2" roughness={0.88} />
    </mesh>
  );
}

function BakeryBuilding({ color }) {
  return (
    <group>
      <RoundedBox
        position={[0, -0.2, 0]}
        scale={[8.4, 0.45, 5.6]}
        color="#dfc5a1"
        radius={0.22}
      />
      <RoundedBox
        position={[0, 1.95, 0]}
        scale={[6.8, 3.8, 3.8]}
        color="#f8e7c8"
        radius={0.18}
      />
      <RoofGable />
      <RoundedBox
        position={[0, 0.2, 1.98]}
        scale={[6.9, 0.4, 0.16]}
        color="#d3b18a"
        radius={0.04}
      />
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 1.78, 4.17, 0]}
          rotation={[0, 0, -side * 0.3]}
        >
          <RoundedBox scale={[3.85, 0.22, 4.5]} radius={0.1} color="#ac7154" />
          {[-1.6, -0.8, 0, 0.8, 1.6].map((z) => (
            <RoundedBox
              key={z}
              position={[0, 0.13, z]}
              scale={[3.78, 0.075, 0.065]}
              radius={0.025}
              color="#c48e68"
            />
          ))}
        </group>
      ))}
      <RoundedBox
        position={[0, 4.74, 0]}
        scale={[0.25, 0.2, 4.5]}
        radius={0.08}
        color="#b47b57"
      />
      <group position={[-2.3, 4.25, -0.7]}>
        <RoundedBox scale={[0.7, 1.4, 0.72]} color="#ceaa87" radius={0.07} />
        <RoundedBox
          position={[0, 0.7, 0]}
          scale={[0.86, 0.16, 0.86]}
          color="#ac8060"
          radius={0.06}
        />
      </group>
      {[-2.1, 2.1].map((x) => (
        <group key={x} position={[x, 1.9, 2]}>
          <RoundedBox scale={[1.75, 1.65, 0.2]} color="#a17a58" radius={0.12} />
          <RoundedBox
            position={[0, 0, 0.1]}
            scale={[1.48, 1.39, 0.08]}
            color="#bdd9d0"
            radius={0.07}
            roughness={0.45}
          />
          <RoundedBox
            position={[0, 0, 0.18]}
            scale={[0.065, 1.42, 0.065]}
            color="#e9d5ae"
            radius={0.02}
          />
          <RoundedBox
            position={[0, 0, 0.18]}
            scale={[1.5, 0.065, 0.065]}
            color="#e9d5ae"
            radius={0.02}
          />
          <RoundedBox
            position={[0, -0.88, 0.1]}
            scale={[1.94, 0.14, 0.38]}
            color="#b38b63"
            radius={0.04}
          />
        </group>
      ))}
      <RoundedBox
        position={[0, 1.34, 2.03]}
        scale={[1.45, 2.38, 0.22]}
        color="#ab805a"
        radius={0.16}
      />
      <RoundedBox
        position={[0, 1.35, 2.16]}
        scale={[1.17, 2.12, 0.09]}
        color={color}
        radius={0.12}
      />
      <RoundedBox
        position={[0, 1.86, 2.23]}
        scale={[0.74, 0.72, 0.045]}
        color="#c6dfcf"
        radius={0.08}
      />
      <mesh position={[0.4, 1.12, 2.26]} castShadow>
        <sphereGeometry args={[0.065, 12, 8]} />
        <meshStandardMaterial color="#d3ad66" roughness={0.45} />
      </mesh>
      <RoundedBox
        position={[0, 0.05, 2.3]}
        scale={[1.9, 0.15, 0.65]}
        color="#c8ad8a"
        radius={0.06}
      />
      <group position={[0, 3.55, 2.12]} rotation={[0.12, 0, 0]}>
        {Array.from({ length: 10 }, (_, i) => (
          <RoundedBox
            key={i}
            position={[-2.92 + i * 0.65, 0, 0.23]}
            scale={[0.65, 0.16, 1.06]}
            radius={0.035}
            color={i % 2 ? palette.cream : color}
          />
        ))}
      </group>
      {Array.from({ length: 10 }, (_, i) => (
        <RoundedBox
          key={i}
          position={[-2.92 + i * 0.65, 3.4, 2.67]}
          scale={[0.65, 0.32, 0.14]}
          radius={0.07}
          color={i % 2 ? palette.cream : color}
        />
      ))}
    </group>
  );
}

function FoxSign(props) {
  return (
    <group {...props}>
      <RoundedBox scale={[1.8, 0.65, 0.18]} radius={0.06} color="#ac7850" />
      <group scale={0.25} position={[0, -0.26, 0.12]}>
        <Fox position={[0, 0, 0]} quiet />
      </group>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 0, 0.12]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color="#e9c16d" />
        </mesh>
      ))}
    </group>
  );
}

function SignInstallation({ onInstall }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 1.2, 1);
    camera.updateMatrixWorld();
  }, [camera]);
  const [selected, setSelected] = useState(false);
  const [point, setPoint] = useState(null);
  const drag = useRef(null);
  const committed = useRef(false);
  const plane = new Plane(new Vector3(0, 0, 1), -2.65);
  const cancel = () => {
    drag.current = null;
    setPoint(null);
    setSelected(false);
  };
  useEffect(() => {
    const secondary = (event) => {
      if (!event.isPrimary) cancel();
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("pointerdown", secondary);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("pointerdown", secondary);
    };
  }, []);
  const install = () => {
    if (committed.current) return;
    committed.current = true;
    onInstall();
  };
  return (
    <>
      <group
        position={[0, 2.85, 2.65]}
        onClick={(event) => {
          event.stopPropagation();
          if (selected) install();
        }}
      >
        <RoundedBox
          scale={[2.4, 1.15, 0.12]}
          radius={0.1}
          color={selected ? "#e9cb89" : "#bdd0b1"}
        />
        <mesh visible={false}>
          <boxGeometry args={[3.4, 1.8, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </group>
      <group
        position={point || [0, 0.85, 3.5]}
        onPointerDown={(event) => {
          if (!event.nativeEvent.isPrimary || event.button !== 0) return;
          event.stopPropagation();
          drag.current = {
            id: event.pointerId,
            x: event.nativeEvent.clientX,
            y: event.nativeEvent.clientY,
            moved: false,
          };
          event.target.setPointerCapture(event.pointerId);
          setSelected(true);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          if (
            Math.hypot(
              event.nativeEvent.clientX - start.x,
              event.nativeEvent.clientY - start.y,
            ) < 8 &&
            !start.moved
          )
            return;
          start.moved = true;
          const hit = event.ray.intersectPlane(plane, new Vector3());
          if (hit) {
            start.point = hit;
            setPoint(hit.toArray());
          }
        }}
        onPointerUp={(event) => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          event.stopPropagation();
          drag.current = null;
          event.target.releasePointerCapture(event.pointerId);
          setPoint(null);
          if (start.moved) {
            if (
              start.point &&
              Math.abs(start.point.x) < 1.7 &&
              Math.abs(start.point.y - 2.85) < 0.9
            )
              install();
            else setSelected(false);
          }
        }}
        onLostPointerCapture={() => {
          if (drag.current) cancel();
        }}
      >
        <FoxSign />
        <mesh visible={false}>
          <boxGeometry args={[2.5, 1.2, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </>
  );
}

function SceneContent({
  selected,
  onSelect,
  color,
  placed,
  freeCount,
  freeItem,
  installSign,
  onInstallSign,
}) {
  return (
    <>
      <BakeryBuilding color={color} />
      <RoundedBox
        position={[0, -0.04, 3.1]}
        scale={[8.7, 0.18, 2.5]}
        color="#9bc486"
        radius={0.2}
      />
      <RoundedBox
        position={[-1.4, 0.28, 1.9]}
        scale={[3.3, 0.28, 1.1]}
        color={palette.wood}
        radius={0.12}
      />
      {freeCount === null && (
        <>
          <Bread
            position={[-2.15, 0.62, 1.85]}
            selected={selected === "bread"}
            onClick={() => onSelect("bread")}
          />
          <Bread
            position={[-1.4, 0.62, 1.85]}
            selected={selected === "bread-2"}
            onClick={() => onSelect("bread-2")}
          />
          <Croissant
            position={[-0.62, 0.66, 1.86]}
            selected={selected === "croissant"}
            onClick={() => onSelect("croissant")}
          />
        </>
      )}
      {freeCount !== null && (
        <group position={[0, 0.7, 3.6]}>
          <Tray slots={5} />
          {Array.from({ length: freeCount }, (_, i) => (
            <Snack key={i} kind={freeItem} position={slotPosition(i)} />
          ))}
        </group>
      )}
      {placed.includes("sign") && <FoxSign position={[0, 2.85, 2.3]} />}
      {installSign && <SignInstallation onInstall={onInstallSign} />}
      {placed.includes("flowers") && (
        <group position={[-3.4, 0.3, 2.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.38, 0.25, 0.55, 16]} />
            <meshStandardMaterial color="#ce8d75" />
          </mesh>
          {[-0.2, 0, 0.2].map((x, i) => (
            <group key={i} position={[x, 0.6 + i * 0.12, 0]}>
              <mesh>
                <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
                <meshStandardMaterial color="#67985e" />
              </mesh>
              {Array.from({ length: 5 }, (_, k) => (
                <mesh
                  key={k}
                  position={[
                    Math.cos(k * 1.257) * 0.12,
                    0.4 + Math.sin(k * 1.257) * 0.12,
                    0,
                  ]}
                  scale={[1, 1, 0.5]}
                >
                  <sphereGeometry args={[0.11, 10, 8]} />
                  <meshStandardMaterial color={i % 2 ? "#eac66b" : "#e5a1ac"} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {placed.includes("flags") &&
        Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={i}
            position={[-2.4 + i * 0.8, 2.75, 2.4]}
            rotation={[0, 0, Math.PI]}
            castShadow
          >
            <coneGeometry args={[0.2, 0.4, 3]} />
            <meshStandardMaterial
              color={["#e5a1ac", "#eac66b", "#8fb39a"][i % 3]}
            />
          </mesh>
        ))}
      {placed.includes("table") && (
        <group position={[3.5, 0.6, 3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.15, 24]} />
            <meshStandardMaterial color="#b98a5f" />
          </mesh>
          {[-0.5, 0.5].flatMap((x) =>
            [-0.4, 0.4].map((z) => (
              <RoundedBox
                key={`${x}-${z}`}
                position={[x, -0.35, z]}
                scale={[0.1, 0.65, 0.1]}
                radius={0.03}
                color="#986a49"
              />
            )),
          )}
        </group>
      )}
      {placed.includes("lamp") && (
        <group position={[2.1, 2.3, 2.2]}>
          <mesh>
            <sphereGeometry args={[0.14, 12, 8]} />
            <meshStandardMaterial
              color="#ffe49b"
              emissive="#e5b85a"
              emissiveIntensity={0.7}
            />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
              <mesh position={[0, 0.2, 0]}>
                <coneGeometry args={[0.12, 0.32, 4]} />
                <meshStandardMaterial
                  color="#ffe49b"
                  emissive="#e5b85a"
                  emissiveIntensity={0.7}
                />
              </mesh>
            </group>
          ))}
          <pointLight color="#ffe2a1" intensity={2} distance={4} />
        </group>
      )}
      <Fox />
      <mesh position={[2.4, 0.75, 1.95]} castShadow>
        <cylinderGeometry args={[0.65, 0.72, 0.28, 16]} />
        <meshStandardMaterial color="#e8c38a" roughness={0.85} />
      </mesh>
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[2.4 + x, 0.98, 1.95]} castShadow>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color={palette.bread} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[2.4, 1.34, 2]} castShadow>
        <torusGeometry args={[0.28, 0.035, 8, 16]} />
        <meshStandardMaterial color="#e6b45e" roughness={0.7} />
      </mesh>
    </>
  );
}

export default function BakeryScene({
  selected,
  onSelect = () => {},
  color = "#8fb39a",
  paused = false,
  placed = [],
  freeCount = null,
  freeItem = "croissant",
  installSign = false,
  onInstallSign,
}) {
  const colorValue = color;
  return (
    <div
      className="bk-scene-3d"
      style={installSign ? { touchAction: "none" } : undefined}
      aria-label="阿栗的 3D 微縮麵包店"
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: installSign ? [0, 4, 12] : [8, 6.2, 11], fov: 38 }}
        fallback={<div className="bk-scene-fallback">麵包店正在準備中</div>}
      >
        <color attach="background" args={["#ecebdc"]} />
        <BakeryLighting overview />
        <SceneContent
          selected={selected}
          onSelect={onSelect}
          color={colorValue}
          placed={placed}
          freeCount={freeCount}
          freeItem={freeItem}
          installSign={installSign}
          onInstallSign={onInstallSign}
        />
        <OrbitControls
          enabled={!paused && !installSign}
          enablePan={false}
          minDistance={8}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={0.48}
          target={[0, 1.2, 1]}
        />
      </Canvas>
    </div>
  );
}
