<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  type?: 'output' | 'transfer'
  vth?: number
}>()

const chartRef = ref<HTMLDivElement>()
const Plotly = ref<any>(null)

const vth = props.vth ?? 0.4

// Generate I-V data using simplified MOSFET equations
function generateOutputIV() {
  const traces = []
  const vgsValues = [0.4, 0.6, 0.8, 1.0, 1.2]
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

  vgsValues.forEach((vgs, i) => {
    const vds: number[] = []
    const ids: number[] = []
    const vov = vgs - vth

    for (let v = 0; v <= 1.2; v += 0.02) {
      vds.push(v)
      if (vov <= 0) {
        ids.push(0)
      } else if (v < vov) {
        // Linear region
        ids.push(100 * (vov * v - v * v / 2))
      } else {
        // Saturation region with CLM
        ids.push(100 * (vov * vov / 2) * (1 + 0.05 * v))
      }
    }

    traces.push({
      x: vds,
      y: ids,
      name: `Vgs = ${vgs}V`,
      type: 'scatter',
      mode: 'lines',
      line: { color: colors[i], width: 2 }
    })
  })

  return traces
}

function generateTransferIV() {
  const vgs: number[] = []
  const ids_lin: number[] = []
  const ids_log: number[] = []
  const vds = 0.5
  const n = 1.3
  const vt = 0.026

  for (let v = 0; v <= 1.2; v += 0.02) {
    vgs.push(v)
    const vov = v - vth

    if (vov < 0) {
      // Subthreshold
      const isub = 1e-3 * Math.exp(v / (n * vt)) * (1 - Math.exp(-vds / vt))
      ids_lin.push(isub)
      ids_log.push(Math.max(isub, 1e-6))
    } else {
      // Above threshold
      const id = 100 * (vov * vov / 2) * (1 + 0.05 * vds)
      ids_lin.push(id)
      ids_log.push(id)
    }
  }

  return [
    {
      x: vgs,
      y: ids_lin,
      name: 'Id (linear)',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#3b82f6', width: 2 },
      yaxis: 'y'
    },
    {
      x: vgs,
      y: ids_log,
      name: 'Id (log)',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#ef4444', width: 2, dash: 'dash' },
      yaxis: 'y2'
    }
  ]
}

onMounted(async () => {
  // Dynamic import for SSR compatibility
  const PlotlyModule = await import('plotly.js-dist-min')
  Plotly.value = PlotlyModule.default

  const traces = props.type === 'transfer' ? generateTransferIV() : generateOutputIV()

  const layout: any = {
    margin: { t: 30, r: props.type === 'transfer' ? 60 : 30, b: 50, l: 60 },
    xaxis: {
      title: props.type === 'transfer' ? 'Vgs (V)' : 'Vds (V)',
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    yaxis: {
      title: 'Id (μA)',
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255,255,255,0.8)'
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 11 }
  }

  if (props.type === 'transfer') {
    layout.yaxis2 = {
      title: 'Id (log)',
      type: 'log',
      overlaying: 'y',
      side: 'right',
      gridcolor: 'rgba(128,128,128,0.1)'
    }
  }

  Plotly.value.newPlot(chartRef.value, traces, layout, {
    responsive: true,
    displayModeBar: false
  })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 300px;"></div>
</template>
