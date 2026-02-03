import { useState, useEffect, useCallback } from 'react';
import { parseScientific, formatForInput } from '../../utils/format';
import styles from './ParamSlider.module.css';

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  tooltip?: string;
  logScale?: boolean;
  onChange: (value: number) => void;
}

export function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  tooltip,
  logScale = false,
  onChange,
}: ParamSliderProps) {
  const [inputValue, setInputValue] = useState(formatForInput(value));
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatForInput(value));
    }
  }, [value, isEditing]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue: number;

      if (logScale) {
        // Map slider position to log scale
        const sliderVal = Number(e.target.value);
        const logMin = Math.log10(Math.max(min, 1e-20));
        const logMax = Math.log10(max);
        const logVal = logMin + (sliderVal / 100) * (logMax - logMin);
        newValue = Math.pow(10, logVal);
      } else {
        newValue = Number(e.target.value);
      }

      onChange(newValue);
    },
    [logScale, min, max, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHasError(false);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseScientific(inputValue);
    if (parsed !== null && isFinite(parsed)) {
      // Clamp to valid range
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setInputValue(formatForInput(clamped));
      setHasError(false);
    } else {
      setInputValue(formatForInput(value));
      setHasError(true);
      setTimeout(() => setHasError(false), 1000);
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const getSliderValue = () => {
    if (logScale) {
      const logMin = Math.log10(Math.max(min, 1e-20));
      const logMax = Math.log10(max);
      const logVal = Math.log10(Math.max(value, 1e-20));
      return ((logVal - logMin) / (logMax - logMin)) * 100;
    }
    return value;
  };

  const isOutOfRange = value < min || value > max;

  return (
    <div className={styles.container} title={tooltip}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={`${styles.input} ${hasError ? styles.error : ''} ${isOutOfRange ? styles.warning : ''}`}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={logScale ? 0 : min}
        max={logScale ? 100 : max}
        step={logScale ? 0.1 : step || (max - min) / 100}
        value={getSliderValue()}
        onChange={handleSliderChange}
      />
    </div>
  );
}
