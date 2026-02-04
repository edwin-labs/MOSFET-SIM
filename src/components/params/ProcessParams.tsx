import { useDeviceStore } from '../../store';
import { ParamSlider } from './ParamSlider';
import { ParamSection } from './ParamSection';
import type { ProcessParams as ProcessParamsType } from '../../types/device';

export function ProcessParams() {
  const { processParams, updateProcessParam } = useDeviceStore();

  const update = <K extends keyof ProcessParamsType>(
    group: K,
    key: keyof ProcessParamsType[K],
    value: number
  ) => {
    updateProcessParam(group, key, value as ProcessParamsType[K][keyof ProcessParamsType[K]]);
  };

  return (
    <>
      <ParamSection title="Gate Stack" defaultOpen={true} storageKey="proc-gate">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Material: {processParams.gateStack.gateMaterial}
        </div>
        <ParamSlider
          label="t_{ox}"
          value={processParams.gateStack.oxideThickness}
          min={0.5}
          max={10}
          step={0.1}
          unit="nm"
          tooltip="Gate oxide thickness"
          onChange={(v) => update('gateStack', 'oxideThickness', v)}
        />
        <ParamSlider
          label="L_g"
          value={processParams.gateStack.gateLength}
          min={20}
          max={500}
          step={1}
          unit="nm"
          tooltip="Gate length"
          onChange={(v) => update('gateStack', 'gateLength', v)}
        />
      </ParamSection>

      <ParamSection title="Well Implant" defaultOpen={false} storageKey="proc-well">
        <ParamSlider
          label="N_{well}"
          value={processParams.well.doping}
          min={1e14}
          max={1e18}
          unit="cm⁻³"
          tooltip="Well doping concentration"
          logScale={true}
          onChange={(v) => update('well', 'doping', v)}
        />
        <ParamSlider
          label="d_{well}"
          value={processParams.well.depth}
          min={100}
          max={1000}
          step={10}
          unit="nm"
          tooltip="Well depth"
          onChange={(v) => update('well', 'depth', v)}
        />
      </ParamSection>

      <ParamSection title="Vt Adjust" defaultOpen={false} storageKey="proc-vt">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.vtAdjust.species}
        </div>
        <ParamSlider
          label="\\phi"
          value={processParams.vtAdjust.dose}
          min={1e11}
          max={1e14}
          unit="cm⁻²"
          tooltip="Implant dose"
          logScale={true}
          onChange={(v) => update('vtAdjust', 'dose', v)}
        />
        <ParamSlider
          label="E"
          value={processParams.vtAdjust.energy}
          min={5}
          max={100}
          step={1}
          unit="keV"
          tooltip="Implant energy"
          onChange={(v) => update('vtAdjust', 'energy', v)}
        />
      </ParamSection>

      <ParamSection title="Halo Implant" defaultOpen={false} storageKey="proc-halo">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Enabled: {processParams.halo.enabled ? 'Yes' : 'No'}
        </div>
        {processParams.halo.enabled && (
          <>
            <ParamSlider
              label="\\phi_{halo}"
              value={processParams.halo.dose}
              min={1e12}
              max={1e15}
              unit="cm⁻²"
              logScale={true}
              onChange={(v) => update('halo', 'dose', v)}
            />
            <ParamSlider
              label="\\theta"
              value={processParams.halo.tiltAngle}
              min={0}
              max={60}
              step={1}
              unit="°"
              onChange={(v) => update('halo', 'tiltAngle', v)}
            />
          </>
        )}
      </ParamSection>

      <ParamSection title="S/D Implant" defaultOpen={false} storageKey="proc-sd">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.sdMain.species}
        </div>
        <ParamSlider
          label="\\phi_{SD}"
          value={processParams.sdMain.dose}
          min={1e14}
          max={1e16}
          unit="cm⁻²"
          logScale={true}
          onChange={(v) => update('sdMain', 'dose', v)}
        />
        <ParamSlider
          label="E_{SD}"
          value={processParams.sdMain.energy}
          min={5}
          max={100}
          step={1}
          unit="keV"
          onChange={(v) => update('sdMain', 'energy', v)}
        />
        <ParamSlider
          label="x_j"
          value={processParams.sdMain.depth}
          min={10}
          max={200}
          step={1}
          unit="nm"
          tooltip="Junction depth"
          onChange={(v) => update('sdMain', 'depth', v)}
        />
      </ParamSection>

      <ParamSection title="LDD Implant" defaultOpen={false} storageKey="proc-ldd">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.ldd.species}
        </div>
        <ParamSlider
          label="\\phi_{LDD}"
          value={processParams.ldd.dose}
          min={1e12}
          max={1e15}
          unit="cm⁻²"
          logScale={true}
          onChange={(v) => update('ldd', 'dose', v)}
        />
        <ParamSlider
          label="E_{LDD}"
          value={processParams.ldd.energy}
          min={5}
          max={50}
          step={1}
          unit="keV"
          onChange={(v) => update('ldd', 'energy', v)}
        />
      </ParamSection>

      <ParamSection title="Spacer & Anneal" defaultOpen={false} storageKey="proc-anneal">
        <ParamSlider
          label="W_{sp}"
          value={processParams.spacer.width}
          min={5}
          max={50}
          step={1}
          unit="nm"
          onChange={(v) => update('spacer', 'width', v)}
        />
        <ParamSlider
          label="T_{anneal}"
          value={processParams.anneal.temperature}
          min={800}
          max={1100}
          step={10}
          unit="°C"
          tooltip="Anneal temperature"
          onChange={(v) => update('anneal', 'temperature', v)}
        />
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Anneal: {processParams.anneal.type}
        </div>
      </ParamSection>

      <div style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Process simulation uses implant tables and diffusion models to generate doping profiles.
      </div>
    </>
  );
}
