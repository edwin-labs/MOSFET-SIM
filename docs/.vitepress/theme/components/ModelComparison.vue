<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  effect?: 'dibl' | 'clm' | 'velocity'
}>()

const chartRef = ref<HTMLDivElement>()

onMounted(async () => {
  const Plotly = (await import('plotly.js-dist-min')).default

  const effect = props.effect ?? 'velocity'
  let traces: any[] = []
  let layout: any = {}

  if (effect === 'velocity') {
    // Velocity saturation effect on I-V
    const vds: number[] = []
    const id_levelA: number[] = []
    const id_levelB: number[] = []

    const vgs = 1.0
    const vth = 0.4
    const vov = vgs - vth
    const L = 45  // nm
    const Esat = 0.8  // V/μm

    for (let v = 0; v <= 1.2; v += 0.02) {
      vds.push(v)

      // Level A: No velocity saturation
      if (v < vov) {
        id_levelA.push(100 * (vov * v - v * v / 2))
      } else {
        id_levelA.push(100 * vov * vov / 2)
      }

      // Level B: With velocity saturation
      const vdsat = vov * Esat * L / 1000 / (Esat * L / 1000 + vov)
      if (v < vdsat) {
        const factor = 1 / (1 + v / (Esat * L / 1000))
        id_levelB.push(100 * (vov * v - v * v / 2) * factor)
      } else {
        id_levelB.push(100 * vdsat * vov / 2 * (1 + 0.05 * v))
      }
    }

    traces = [
      { x: vds, y: id_levelA, name: 'Level A (Long-channel)', line: { color: '#3b82f6', width: 2 } },
      { x: vds, y: id_levelB, name: 'Level B (Velocity sat.)', line: { color: '#ef4444', width: 2 } }
    ]

    layout = {
      title: { text: 'Velocity Saturation Effect', font: { size: 13 } },
      xaxis: { title: 'Vds (V)' },
      yaxis: { title: 'Id (μA)' }
    }
  } else if (effect === 'dibl') {
    // DIBL effect on Vth
    const L: number[] = []
    const vth_low: number[] = []
    const vth_high: number[] = []

    const vth0 = 0.4
    const eta = 0.1  // DIBL coefficient (V/V per nm)

    for (let len = 20; len <= 200; len += 5) {
      L.push(len)
      const dibl = eta * 50 / len  // Scales with 1/L
      vth_low.push(vth0)
      vth_high.push(vth0 - dibl * 0.5)  // At Vds = 0.5V
    }

    traces = [
      { x: L, y: vth_low, name: 'Vds = 50mV', line: { color: '#3b82f6', width: 2 } },
      { x: L, y: vth_high, name: 'Vds = 0.5V', line: { color: '#ef4444', width: 2 } }
    ]

    layout = {
      title: { text: 'DIBL Effect on Threshold Voltage', font: { size: 13 } },
      xaxis: { title: 'Channel Length (nm)' },
      yaxis: { title: 'Vth (V)' }
    }
  } else if (effect === 'clm') {
    // Channel length modulation
    const vds: number[] = []
    const id_ideal: number[] = []
    const id_clm: number[] = []

    const vgs = 0.8
    const vth = 0.4
    const vov = vgs - vth
    const idsat = 100 * vov * vov / 2
    const lambda = 0.1  // CLM parameter

    for (let v = 0.4; v <= 1.2; v += 0.02) {
      vds.push(v)
      id_ideal.push(idsat)
      id_clm.push(idsat * (1 + lambda * v))
    }

    traces = [
      { x: vds, y: id_ideal, name: 'Ideal (λ=0)', line: { color: '#3b82f6', width: 2, dash: 'dash' } },
      { x: vds, y: id_clm, name: 'With CLM', line: { color: '#ef4444', width: 2 } }
    ]

    layout = {
      title: { text: 'Channel Length Modulation', font: { size: 13 } },
      xaxis: { title: 'Vds (V)' },
      yaxis: { title: 'Id (μA)', range: [0, 12] }
    }
  }

  Plotly.newPlot(chartRef.value, traces, {
    ...layout,
    margin: { t: 40, r: 30, b: 50, l: 60 },
    xaxis: { ...layout.xaxis, gridcolor: 'rgba(128,128,128,0.2)' },
    yaxis: { ...layout.yaxis, gridcolor: 'rgba(128,128,128,0.2)' },
    legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255,255,255,0.8)' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 11 }
  }, { responsive: true, displayModeBar: false })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 280px;"></div>
</template>
