<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  bias?: 'flatband' | 'accumulation' | 'depletion' | 'inversion'
}>()

const chartRef = ref<HTMLDivElement>()

onMounted(async () => {
  const Plotly = (await import('plotly.js-dist-min')).default

  const bias = props.bias ?? 'inversion'

  // Position array (nm) - Metal | Oxide | Semiconductor
  const x: number[] = []
  const Ec: number[] = []
  const Ev: number[] = []
  const Ef: number[] = []
  const Ei: number[] = []

  const tox = 2  // oxide thickness
  const Eg = 1.12  // Si bandgap
  const qPhiM = 4.1  // Metal work function ref
  const qPhiS = 4.05  // Si electron affinity
  const EfOffset = 0.3  // Ef position in p-type Si (from Ei)

  // Metal region (-5 to 0)
  for (let i = -5; i <= 0; i += 0.5) {
    x.push(i)
    Ec.push(NaN)
    Ev.push(NaN)
    Ef.push(qPhiM)
    Ei.push(NaN)
  }

  // Oxide region (0 to tox)
  const oxideBarrier = 3.1  // SiO2 barrier
  for (let i = 0.2; i <= tox; i += 0.2) {
    x.push(i)
    Ec.push(qPhiS + oxideBarrier - getBandBending(i, tox, bias) * 0.3)
    Ev.push(qPhiS + oxideBarrier - 9 - getBandBending(i, tox, bias) * 0.3)
    Ef.push(NaN)
    Ei.push(NaN)
  }

  // Semiconductor region (tox to tox + 20)
  const xdep = getDepletionWidth(bias)
  for (let i = 0; i <= 20; i += 0.5) {
    const pos = tox + i
    x.push(pos)

    const bend = getSiBandBending(i, xdep, bias)
    Ec.push(qPhiS + Eg / 2 + EfOffset - bend)
    Ev.push(qPhiS - Eg / 2 + EfOffset - bend)
    Ei.push(qPhiS + EfOffset - bend)
    Ef.push(qPhiS)  // Ef is reference (flat in Si bulk)
  }

  function getBandBending(pos: number, tox: number, bias: string): number {
    const t = pos / tox
    switch (bias) {
      case 'accumulation': return -0.5 * t
      case 'flatband': return 0
      case 'depletion': return 0.3 * t
      case 'inversion': return 0.8 * t
      default: return 0
    }
  }

  function getDepletionWidth(bias: string): number {
    switch (bias) {
      case 'accumulation': return 0
      case 'flatband': return 0
      case 'depletion': return 5
      case 'inversion': return 10
      default: return 5
    }
  }

  function getSiBandBending(depth: number, xdep: number, bias: string): number {
    if (bias === 'flatband' || bias === 'accumulation') {
      if (bias === 'accumulation') return -0.3 * Math.exp(-depth / 2)
      return 0
    }

    const maxBend = bias === 'inversion' ? 0.8 : 0.3
    if (depth >= xdep) return 0
    return maxBend * Math.pow(1 - depth / xdep, 2)
  }

  const traces = [
    { x, y: Ec, name: 'Ec', mode: 'lines', line: { color: '#3b82f6', width: 2 } },
    { x, y: Ev, name: 'Ev', mode: 'lines', line: { color: '#ef4444', width: 2 } },
    { x, y: Ei, name: 'Ei', mode: 'lines', line: { color: '#9ca3af', width: 1, dash: 'dot' } },
    { x, y: Ef, name: 'Ef', mode: 'lines', line: { color: '#22c55e', width: 2, dash: 'dash' } }
  ]

  const layout = {
    margin: { t: 30, r: 30, b: 50, l: 60 },
    xaxis: {
      title: 'Position (nm)',
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    yaxis: {
      title: 'Energy (eV)',
      gridcolor: 'rgba(128,128,128,0.2)'
    },
    shapes: [
      // Metal region
      { type: 'rect', x0: -5, x1: 0, y0: 0, y1: 8, fillcolor: 'rgba(156,163,175,0.3)', line: { width: 0 } },
      // Oxide region
      { type: 'rect', x0: 0, x1: tox, y0: 0, y1: 8, fillcolor: 'rgba(96,165,250,0.2)', line: { width: 0 } }
    ],
    annotations: [
      { x: -2.5, y: 7.5, text: 'Metal', showarrow: false, font: { size: 10 } },
      { x: 1, y: 7.5, text: 'Oxide', showarrow: false, font: { size: 10 } },
      { x: 12, y: 7.5, text: 'Si (p-type)', showarrow: false, font: { size: 10 } }
    ],
    legend: { x: 0.7, y: 0.98, bgcolor: 'rgba(255,255,255,0.8)' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 11 }
  }

  Plotly.newPlot(chartRef.value, traces, layout, { responsive: true, displayModeBar: false })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 320px;"></div>
</template>
