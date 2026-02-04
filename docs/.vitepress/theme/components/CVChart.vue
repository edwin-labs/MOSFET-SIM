<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  showRegions?: boolean
}>()

const chartRef = ref<HTMLDivElement>()

onMounted(async () => {
  const Plotly = (await import('plotly.js-dist-min')).default

  // MOS C-V curve parameters
  const Cox = 1.0  // Normalized oxide capacitance
  const Vfb = -0.8
  const Vth = 0.4
  const Cmin = 0.3  // Minimum capacitance in inversion

  const vgs: number[] = []
  const c_hf: number[] = []  // High frequency
  const c_lf: number[] = []  // Low frequency

  for (let v = -2; v <= 2; v += 0.02) {
    vgs.push(v)

    if (v < Vfb) {
      // Accumulation
      c_hf.push(Cox)
      c_lf.push(Cox)
    } else if (v < Vth) {
      // Depletion
      const t = (v - Vfb) / (Vth - Vfb)
      const Cdep = Cox * (1 - t * 0.7)
      c_hf.push(Cdep)
      c_lf.push(Cdep)
    } else {
      // Inversion
      const t = Math.min((v - Vth) / 0.5, 1)
      // High frequency: C stays at Cmin
      c_hf.push(Cmin + (1 - t) * 0.1)
      // Low frequency: C returns to Cox
      c_lf.push(Cmin + t * (Cox - Cmin))
    }
  }

  const traces: any[] = [
    {
      x: vgs,
      y: c_hf,
      name: 'High Frequency',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#3b82f6', width: 2 }
    },
    {
      x: vgs,
      y: c_lf,
      name: 'Low Frequency',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#22c55e', width: 2, dash: 'dash' }
    }
  ]

  // Add region annotations
  const shapes: any[] = []
  const annotations: any[] = []

  if (props.showRegions) {
    shapes.push(
      { type: 'rect', x0: -2, x1: Vfb, y0: 0, y1: 1.1, fillcolor: 'rgba(59,130,246,0.1)', line: { width: 0 } },
      { type: 'rect', x0: Vfb, x1: Vth, y0: 0, y1: 1.1, fillcolor: 'rgba(34,197,94,0.1)', line: { width: 0 } },
      { type: 'rect', x0: Vth, x1: 2, y0: 0, y1: 1.1, fillcolor: 'rgba(239,68,68,0.1)', line: { width: 0 } }
    )
    annotations.push(
      { x: -1.4, y: 1.05, text: 'Accumulation', showarrow: false, font: { size: 10, color: '#3b82f6' } },
      { x: -0.2, y: 1.05, text: 'Depletion', showarrow: false, font: { size: 10, color: '#22c55e' } },
      { x: 1.2, y: 1.05, text: 'Inversion', showarrow: false, font: { size: 10, color: '#ef4444' } }
    )
  }

  Plotly.newPlot(chartRef.value, traces, {
    margin: { t: 30, r: 30, b: 50, l: 60 },
    xaxis: {
      title: 'Vgs (V)',
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    yaxis: {
      title: 'C / Cox',
      range: [0, 1.15],
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    shapes,
    annotations,
    legend: { x: 0.02, y: 0.3, bgcolor: 'rgba(255,255,255,0.8)' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 11 }
  }, { responsive: true, displayModeBar: false })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 300px;"></div>
</template>
