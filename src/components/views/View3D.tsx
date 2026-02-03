import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThreeJS } from '../../hooks/useThreeJS';
import { useDeviceStore, useSimulationStore, useViewStore } from '../../store';
import styles from './View3D.module.css';

interface MOSFETMeshes {
  substrate: THREE.Mesh;
  channel: THREE.Mesh;
  gateOxide: THREE.Mesh;
  gate: THREE.Mesh;
  source: THREE.Mesh;
  drain: THREE.Mesh;
  sourceLDD: THREE.Mesh;
  drainLDD: THREE.Mesh;
  spacerL: THREE.Mesh;
  spacerR: THREE.Mesh;
  depletion: THREE.Mesh;
}

interface TooltipInfo {
  x: number;
  y: number;
  region: string;
  details: string[];
}

// Doping concentration to color (n-type = red, p-type = blue)
function dopingToHex(Nd: number, Na: number): number {
  const netDoping = Nd - Na;
  const absNet = Math.abs(netDoping);
  const minConc = 1e15;
  const maxConc = 1e21;

  if (absNet < minConc) {
    return 0x808080; // Intrinsic - gray
  }

  const logMin = Math.log10(minConc);
  const logMax = Math.log10(maxConc);
  const logVal = Math.log10(Math.min(absNet, maxConc));
  const intensity = (logVal - logMin) / (logMax - logMin);

  if (netDoping > 0) {
    // n-type (donors dominant) - Red shades
    const r = 255;
    const g = Math.round(255 * (1 - intensity * 0.8));
    const b = Math.round(255 * (1 - intensity * 0.8));
    return (r << 16) | (g << 8) | b;
  } else {
    // p-type (acceptors dominant) - Blue shades
    const r = Math.round(255 * (1 - intensity * 0.8));
    const g = Math.round(255 * (1 - intensity * 0.8));
    const b = 255;
    return (r << 16) | (g << 8) | b;
  }
}

export function View3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<MOSFETMeshes | null>(null);
  const arrowsRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const { scene, camera, renderer } = useThreeJS(containerRef);

  const { deviceType, deviceParams, bias } = useDeviceStore();
  const { depletionWidth, metrics } = useSimulationStore();
  const { showDepletion, showWireframe, colormap, showCurrentFlow } = useViewStore();

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!containerRef.current || !camera || !renderer || !meshesRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const meshes = Object.entries(meshesRef.current).map(([name, mesh]) => ({
        name,
        mesh,
      }));

      const intersects = raycasterRef.current.intersectObjects(
        meshes.map((m) => m.mesh)
      );

      if (intersects.length > 0) {
        const hit = intersects[0];
        const matchedMesh = meshes.find((m) => m.mesh === hit.object);

        if (matchedMesh) {
          const regionNames: Record<string, string> = {
            substrate: 'Substrate',
            channel: 'Channel',
            gateOxide: 'Gate Oxide',
            gate: 'Gate',
            source: 'Source',
            drain: 'Drain',
            sourceLDD: 'Source LDD',
            drainLDD: 'Drain LDD',
            spacerL: 'Spacer',
            spacerR: 'Spacer',
            depletion: 'Depletion Region',
          };

          const details: string[] = [];
          const isNMOS = deviceType === 'nmos';

          switch (matchedMesh.name) {
            case 'substrate':
              details.push(`Type: ${isNMOS ? 'p-type' : 'n-type'}`);
              details.push(`Doping: ${deviceParams.substrate.doping.toExponential(1)} cm⁻³`);
              break;
            case 'channel':
              details.push(`L: ${deviceParams.gate.length} nm`);
              details.push(`Doping: ${deviceParams.channel.doping.toExponential(1)} cm⁻³`);
              if (metrics?.Vth) details.push(`Vth: ${metrics.Vth.toFixed(3)} V`);
              break;
            case 'gate':
              details.push(`Material: ${deviceParams.gate.gateMaterial}`);
              details.push(`Work fn: ${deviceParams.gate.workFunction} eV`);
              break;
            case 'gateOxide':
              details.push(`Material: ${deviceParams.gate.oxideMaterial}`);
              details.push(`Thickness: ${deviceParams.gate.tox} nm`);
              break;
            case 'source':
            case 'drain':
              details.push(`Type: ${isNMOS ? 'n+' : 'p+'}`);
              details.push(`Doping: ${deviceParams.sourceDrain.doping.toExponential(1)} cm⁻³`);
              details.push(`Junction: ${deviceParams.sourceDrain.junctionDepth} nm`);
              break;
            case 'sourceLDD':
            case 'drainLDD':
              details.push(`Type: ${isNMOS ? 'n' : 'p'}`);
              details.push(`Doping: ${deviceParams.sourceDrain.lddDoping.toExponential(1)} cm⁻³`);
              break;
            case 'depletion':
              details.push(`Width: ${depletionWidth.toFixed(1)} nm`);
              break;
          }

          setTooltip({
            x: event.clientX - rect.left + 10,
            y: event.clientY - rect.top + 10,
            region: regionNames[matchedMesh.name] || matchedMesh.name,
            details,
          });
        }
      } else {
        setTooltip(null);
      }
    },
    [camera, renderer, deviceType, deviceParams, metrics, depletionWidth]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  useEffect(() => {
    if (!scene) return;

    // Clear existing meshes
    if (meshesRef.current) {
      Object.values(meshesRef.current).forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
    }

    const isNMOS = deviceType === 'nmos';

    // Doping concentrations for colormap
    const Nsub = deviceParams.substrate.doping;
    const Nsd = deviceParams.sourceDrain.doping;
    const Nldd = deviceParams.sourceDrain.lddDoping;

    // Colors - either structural or doping-based
    const colors = colormap === 'doping'
      ? {
          substrate: dopingToHex(isNMOS ? 0 : Nsub, isNMOS ? Nsub : 0),
          channel: dopingToHex(isNMOS ? 0 : Nsub, isNMOS ? Nsub : 0),
          gateOxide: 0x80deea,
          gate: 0x9e9e9e,
          source: dopingToHex(isNMOS ? Nsd : 0, isNMOS ? 0 : Nsd),
          drain: dopingToHex(isNMOS ? Nsd : 0, isNMOS ? 0 : Nsd),
          ldd: dopingToHex(isNMOS ? Nldd : 0, isNMOS ? 0 : Nldd),
          spacer: 0xffeb3b,
          depletion: 0x00ff00,
        }
      : {
          substrate: isNMOS ? 0x2196f3 : 0xf44336, // p-type blue, n-type red
          channel: isNMOS ? 0x64b5f6 : 0xef5350,
          gateOxide: 0x80deea,
          gate: 0x9e9e9e,
          source: isNMOS ? 0xf44336 : 0x2196f3, // n+ red, p+ blue
          drain: isNMOS ? 0xf44336 : 0x2196f3,
          ldd: isNMOS ? 0xef9a9a : 0x90caf9,
          spacer: 0xffeb3b,
          depletion: 0x00ff00,
        };

    // Dimensions from params (scaled for visualization)
    // Coordinate system: X = channel direction, Y = vertical (up), Z = width
    const scale = 1; // 1 unit = 1 nm in visualization
    const L = deviceParams.gate.length * scale;
    const W = Math.min(deviceParams.geometry.width * scale, 200); // Cap width for viz
    const tox = deviceParams.gate.tox * scale * 10; // Exaggerate oxide for visibility
    const xj = deviceParams.sourceDrain.junctionDepth * scale;
    const lddLen = deviceParams.sourceDrain.lddLength * scale;
    const subDepth = 100 * scale;
    const sdLen = 60 * scale;
    const gateHeight = 40 * scale;
    const spacerWidth = 15 * scale;

    // Create materials
    const createMaterial = (color: number, opacity = 1) =>
      new THREE.MeshPhongMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        wireframe: showWireframe,
        side: THREE.DoubleSide,
      });

    // BoxGeometry(width=X, height=Y, depth=Z)

    // Substrate (below junction)
    const subGeo = new THREE.BoxGeometry(L + sdLen * 2 + lddLen * 2, subDepth, W);
    const substrate = new THREE.Mesh(subGeo, createMaterial(colors.substrate));
    substrate.position.set(0, -xj - subDepth / 2, 0);
    scene.add(substrate);

    // Channel region (under gate, from surface to junction depth)
    const chGeo = new THREE.BoxGeometry(L, xj, W);
    const channel = new THREE.Mesh(chGeo, createMaterial(colors.channel));
    channel.position.set(0, -xj / 2, 0);
    scene.add(channel);

    // Gate oxide (on top of surface)
    const oxGeo = new THREE.BoxGeometry(L + spacerWidth * 2, tox, W);
    const gateOxide = new THREE.Mesh(oxGeo, createMaterial(colors.gateOxide, 0.7));
    gateOxide.position.set(0, tox / 2, 0);
    scene.add(gateOxide);

    // Gate electrode (on top of oxide)
    const gateGeo = new THREE.BoxGeometry(L, gateHeight, W);
    const gate = new THREE.Mesh(gateGeo, createMaterial(colors.gate));
    gate.position.set(0, tox + gateHeight / 2, 0);
    scene.add(gate);

    // Source (left side)
    const srcGeo = new THREE.BoxGeometry(sdLen, xj, W);
    const source = new THREE.Mesh(srcGeo, createMaterial(colors.source));
    source.position.set(-L / 2 - lddLen - sdLen / 2, -xj / 2, 0);
    scene.add(source);

    // Drain (right side)
    const drnGeo = new THREE.BoxGeometry(sdLen, xj, W);
    const drain = new THREE.Mesh(drnGeo, createMaterial(colors.drain));
    drain.position.set(L / 2 + lddLen + sdLen / 2, -xj / 2, 0);
    scene.add(drain);

    // Source LDD (between source and channel)
    const srcLddGeo = new THREE.BoxGeometry(lddLen, xj * 0.7, W);
    const sourceLDD = new THREE.Mesh(srcLddGeo, createMaterial(colors.ldd));
    sourceLDD.position.set(-L / 2 - lddLen / 2, -xj * 0.35, 0);
    scene.add(sourceLDD);

    // Drain LDD (between channel and drain)
    const drnLddGeo = new THREE.BoxGeometry(lddLen, xj * 0.7, W);
    const drainLDD = new THREE.Mesh(drnLddGeo, createMaterial(colors.ldd));
    drainLDD.position.set(L / 2 + lddLen / 2, -xj * 0.35, 0);
    scene.add(drainLDD);

    // Left spacer (next to gate on source side)
    const spacerGeo = new THREE.BoxGeometry(spacerWidth, gateHeight + tox, W);
    const spacerL = new THREE.Mesh(spacerGeo, createMaterial(colors.spacer, 0.8));
    spacerL.position.set(-L / 2 - spacerWidth / 2, (gateHeight + tox) / 2, 0);
    scene.add(spacerL);

    // Right spacer (next to gate on drain side)
    const spacerR = new THREE.Mesh(spacerGeo.clone(), createMaterial(colors.spacer, 0.8));
    spacerR.position.set(L / 2 + spacerWidth / 2, (gateHeight + tox) / 2, 0);
    scene.add(spacerR);

    // Depletion region (semi-transparent overlay under channel)
    const depH = Math.max(depletionWidth * scale, 5);
    const depGeo = new THREE.BoxGeometry(L + lddLen * 2, depH, W);
    const depletion = new THREE.Mesh(depGeo, createMaterial(colors.depletion, 0.3));
    depletion.position.set(0, -depH / 2, 0);
    depletion.visible = showDepletion;
    scene.add(depletion);

    meshesRef.current = {
      substrate,
      channel,
      gateOxide,
      gate,
      source,
      drain,
      sourceLDD,
      drainLDD,
      spacerL,
      spacerR,
      depletion,
    };

    // Add current flow arrows if enabled
    if (showCurrentFlow && Math.abs(bias.vds) > 0.01) {
      // Remove existing arrows
      if (arrowsRef.current) {
        scene.remove(arrowsRef.current);
        arrowsRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          }
        });
      }

      const arrowGroup = new THREE.Group();
      const arrowColor = isNMOS ? 0x00ff00 : 0xff00ff;
      const arrowMat = new THREE.MeshBasicMaterial({ color: arrowColor });

      // Create arrows along channel from source to drain
      const numArrows = 5;
      const startX = -L / 2 - lddLen;
      const endX = L / 2 + lddLen;
      const arrowY = -xj * 0.3;

      for (let i = 0; i < numArrows; i++) {
        const t = (i + 0.5) / numArrows;
        const x = startX + t * (endX - startX);

        // Arrow shaft (cylinder)
        const shaftGeo = new THREE.CylinderGeometry(1, 1, 15, 6);
        const shaft = new THREE.Mesh(shaftGeo, arrowMat);
        shaft.rotation.z = (isNMOS ? -1 : 1) * Math.PI / 2;
        shaft.position.set(x, arrowY, 0);
        arrowGroup.add(shaft);

        // Arrow head (cone)
        const headGeo = new THREE.ConeGeometry(3, 8, 6);
        const head = new THREE.Mesh(headGeo, arrowMat);
        head.rotation.z = (isNMOS ? -1 : 1) * Math.PI / 2;
        head.position.set(x + (isNMOS ? 10 : -10), arrowY, 0);
        arrowGroup.add(head);
      }

      scene.add(arrowGroup);
      arrowsRef.current = arrowGroup;
    } else if (arrowsRef.current) {
      scene.remove(arrowsRef.current);
      arrowsRef.current = null;
    }
  }, [scene, deviceType, deviceParams, showWireframe, depletionWidth, showDepletion, colormap, showCurrentFlow, bias]);

  // Update depletion region visibility
  useEffect(() => {
    if (meshesRef.current) {
      meshesRef.current.depletion.visible = showDepletion;
    }
  }, [showDepletion]);

  // Mouse event listeners for tooltip
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={containerRef} className={styles.container}>
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className={styles.tooltipTitle}>{tooltip.region}</div>
          {tooltip.details.map((detail, i) => (
            <div key={i} className={styles.tooltipDetail}>{detail}</div>
          ))}
        </div>
      )}
    </div>
  );
}
