import { useDeviceStore } from '../../store';
import { ParamSlider } from './ParamSlider';
import { ParamSection } from './ParamSection';

export function BiasControls() {
  const { deviceType, bias, updateBias } = useDeviceStore();
  const isNMOS = deviceType === 'nmos';

  return (
    <ParamSection title="Bias Conditions" defaultOpen={true}>
      <ParamSlider
        label="V_GS"
        value={bias.vgs}
        min={isNMOS ? -0.5 : -2.0}
        max={isNMOS ? 2.0 : 0.5}
        step={0.01}
        unit="V"
        tooltip="Gate-Source Voltage"
        onChange={(v) => updateBias('vgs', v)}
      />
      <ParamSlider
        label="V_DS"
        value={bias.vds}
        min={isNMOS ? 0 : -2.0}
        max={isNMOS ? 2.0 : 0}
        step={0.01}
        unit="V"
        tooltip="Drain-Source Voltage"
        onChange={(v) => updateBias('vds', v)}
      />
      <ParamSlider
        label="V_BS"
        value={bias.vbs}
        min={isNMOS ? -2.0 : 0}
        max={isNMOS ? 0.5 : 2.0}
        step={0.01}
        unit="V"
        tooltip="Body-Source Voltage"
        onChange={(v) => updateBias('vbs', v)}
      />
    </ParamSection>
  );
}
