import { useDeviceStore } from '../../store';
import { ParamSlider } from './ParamSlider';
import { ParamSection } from './ParamSection';
import type { DeviceParams as DeviceParamsType } from '../../types/device';

export function DeviceParams() {
  const { deviceParams, updateDeviceParam } = useDeviceStore();

  const update = <K extends keyof DeviceParamsType>(
    group: K,
    key: keyof DeviceParamsType[K],
    value: number
  ) => {
    updateDeviceParam(group, key, value as DeviceParamsType[K][keyof DeviceParamsType[K]]);
  };

  return (
    <>
      <ParamSection title="Gate Stack" defaultOpen={true}>
        <ParamSlider
          label="t_{ox}"
          value={deviceParams.gate.tox}
          min={0.5}
          max={10}
          step={0.1}
          unit="nm"
          tooltip="Gate oxide thickness"
          onChange={(v) => update('gate', 'tox', v)}
        />
        <ParamSlider
          label="L_{eff}"
          value={deviceParams.gate.length}
          min={20}
          max={500}
          step={1}
          unit="nm"
          tooltip="Effective channel length"
          onChange={(v) => update('gate', 'length', v)}
        />
        <ParamSlider
          label="\\Phi_M"
          value={deviceParams.gate.workFunction}
          min={4.0}
          max={5.5}
          step={0.01}
          unit="eV"
          tooltip="Gate work function"
          onChange={(v) => update('gate', 'workFunction', v)}
        />
      </ParamSection>

      <ParamSection title="Channel" defaultOpen={true}>
        <ParamSlider
          label="N_{ch}"
          value={deviceParams.channel.doping}
          min={1e15}
          max={1e19}
          unit="cm⁻³"
          tooltip="Channel doping concentration"
          logScale={true}
          onChange={(v) => update('channel', 'doping', v)}
        />
      </ParamSection>

      <ParamSection title="Source/Drain" defaultOpen={true}>
        <ParamSlider
          label="N_{SD}"
          value={deviceParams.sourceDrain.doping}
          min={1e18}
          max={1e21}
          unit="cm⁻³"
          tooltip="S/D doping concentration"
          logScale={true}
          onChange={(v) => update('sourceDrain', 'doping', v)}
        />
        <ParamSlider
          label="x_j"
          value={deviceParams.sourceDrain.junctionDepth}
          min={10}
          max={200}
          step={1}
          unit="nm"
          tooltip="Junction depth"
          onChange={(v) => update('sourceDrain', 'junctionDepth', v)}
        />
        <ParamSlider
          label="N_{LDD}"
          value={deviceParams.sourceDrain.lddDoping}
          min={1e17}
          max={1e20}
          unit="cm⁻³"
          tooltip="LDD doping concentration"
          logScale={true}
          onChange={(v) => update('sourceDrain', 'lddDoping', v)}
        />
        <ParamSlider
          label="L_{LDD}"
          value={deviceParams.sourceDrain.lddLength}
          min={5}
          max={50}
          step={1}
          unit="nm"
          tooltip="LDD extension length"
          onChange={(v) => update('sourceDrain', 'lddLength', v)}
        />
      </ParamSection>

      <ParamSection title="Substrate" defaultOpen={true}>
        <ParamSlider
          label="N_{sub}"
          value={deviceParams.substrate.doping}
          min={1e14}
          max={1e18}
          unit="cm⁻³"
          tooltip="Substrate doping concentration"
          logScale={true}
          onChange={(v) => update('substrate', 'doping', v)}
        />
      </ParamSection>

      <ParamSection title="Geometry" defaultOpen={false}>
        <ParamSlider
          label="W"
          value={deviceParams.geometry.width}
          min={50}
          max={2000}
          step={10}
          unit="nm"
          tooltip="Channel width"
          onChange={(v) => update('geometry', 'width', v)}
        />
        <ParamSlider
          label="L_{ov}"
          value={deviceParams.geometry.overlapLength}
          min={0}
          max={20}
          step={1}
          unit="nm"
          tooltip="Gate-S/D overlap"
          onChange={(v) => update('geometry', 'overlapLength', v)}
        />
      </ParamSection>

      <ParamSection title="Advanced" defaultOpen={false}>
        <ParamSlider
          label="Q_f"
          value={deviceParams.advanced.fixedCharge}
          min={-1e12}
          max={1e12}
          unit="cm⁻²"
          tooltip="Fixed oxide charge"
          onChange={(v) => update('advanced', 'fixedCharge', v)}
        />
        <ParamSlider
          label="D_{it}"
          value={deviceParams.advanced.interfaceTrapDensity}
          min={0}
          max={1e13}
          unit="cm⁻²eV⁻¹"
          tooltip="Interface trap density"
          logScale={true}
          onChange={(v) => update('advanced', 'interfaceTrapDensity', v)}
        />
        <ParamSlider
          label="R_S"
          value={deviceParams.advanced.seriesResistanceS}
          min={0}
          max={1000}
          step={1}
          unit="Ω"
          tooltip="Source series resistance"
          onChange={(v) => update('advanced', 'seriesResistanceS', v)}
        />
        <ParamSlider
          label="R_D"
          value={deviceParams.advanced.seriesResistanceD}
          min={0}
          max={1000}
          step={1}
          unit="Ω"
          tooltip="Drain series resistance"
          onChange={(v) => update('advanced', 'seriesResistanceD', v)}
        />
      </ParamSection>
    </>
  );
}
