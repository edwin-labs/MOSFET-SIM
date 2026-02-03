import { useDeviceStore } from '../../store';
import { ParamSlider } from './ParamSlider';
import { ParamSection } from './ParamSection';

export function ProcessParams() {
  const { processParams } = useDeviceStore();

  return (
    <>
      <ParamSection title="Gate Stack" defaultOpen={true} storageKey="proc-gate">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Material: {processParams.gateStack.gateMaterial}
        </div>
        <ParamSlider
          label="t_ox"
          value={processParams.gateStack.oxideThickness}
          min={0.5}
          max={10}
          step={0.1}
          unit="nm"
          tooltip="Gate oxide thickness"
          onChange={() => {}}
        />
        <ParamSlider
          label="L_g"
          value={processParams.gateStack.gateLength}
          min={20}
          max={500}
          step={1}
          unit="nm"
          tooltip="Gate length"
          onChange={() => {}}
        />
      </ParamSection>

      <ParamSection title="Well Implant" defaultOpen={false} storageKey="proc-well">
        <ParamSlider
          label="N_well"
          value={processParams.well.doping}
          min={1e14}
          max={1e18}
          unit="cm^-3"
          tooltip="Well doping concentration"
          logScale={true}
          onChange={() => {}}
        />
        <ParamSlider
          label="Depth"
          value={processParams.well.depth}
          min={100}
          max={1000}
          step={10}
          unit="nm"
          tooltip="Well depth"
          onChange={() => {}}
        />
      </ParamSection>

      <ParamSection title="Vt Adjust" defaultOpen={false} storageKey="proc-vt">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.vtAdjust.species}
        </div>
        <ParamSlider
          label="Dose"
          value={processParams.vtAdjust.dose}
          min={1e11}
          max={1e14}
          unit="cm^-2"
          tooltip="Implant dose"
          logScale={true}
          onChange={() => {}}
        />
        <ParamSlider
          label="Energy"
          value={processParams.vtAdjust.energy}
          min={5}
          max={100}
          step={1}
          unit="keV"
          tooltip="Implant energy"
          onChange={() => {}}
        />
      </ParamSection>

      <ParamSection title="Halo Implant" defaultOpen={false} storageKey="proc-halo">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Enabled: {processParams.halo.enabled ? 'Yes' : 'No'}
        </div>
        {processParams.halo.enabled && (
          <>
            <ParamSlider
              label="Dose"
              value={processParams.halo.dose}
              min={1e12}
              max={1e15}
              unit="cm^-2"
              logScale={true}
              onChange={() => {}}
            />
            <ParamSlider
              label="Angle"
              value={processParams.halo.tiltAngle}
              min={0}
              max={60}
              step={1}
              unit="deg"
              onChange={() => {}}
            />
          </>
        )}
      </ParamSection>

      <ParamSection title="S/D Implant" defaultOpen={false} storageKey="proc-sd">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.sdMain.species}
        </div>
        <ParamSlider
          label="Dose"
          value={processParams.sdMain.dose}
          min={1e14}
          max={1e16}
          unit="cm^-2"
          logScale={true}
          onChange={() => {}}
        />
        <ParamSlider
          label="Energy"
          value={processParams.sdMain.energy}
          min={5}
          max={100}
          step={1}
          unit="keV"
          onChange={() => {}}
        />
      </ParamSection>

      <ParamSection title="LDD Implant" defaultOpen={false} storageKey="proc-ldd">
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Species: {processParams.ldd.species}
        </div>
        <ParamSlider
          label="Dose"
          value={processParams.ldd.dose}
          min={1e12}
          max={1e15}
          unit="cm^-2"
          logScale={true}
          onChange={() => {}}
        />
      </ParamSection>

      <ParamSection title="Spacer & Anneal" defaultOpen={false} storageKey="proc-anneal">
        <ParamSlider
          label="Spacer W"
          value={processParams.spacer.width}
          min={5}
          max={50}
          step={1}
          unit="nm"
          onChange={() => {}}
        />
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
          Anneal: {processParams.anneal.type} @ {processParams.anneal.temperature}C
        </div>
      </ParamSection>

      <div style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Process simulation uses implant tables and diffusion models to generate doping profiles.
      </div>
    </>
  );
}
