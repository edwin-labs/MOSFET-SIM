<script setup lang="ts">
import { ref, onMounted } from 'vue'

const chartRef = ref<HTMLDivElement>()

onMounted(async () => {
  const Plotly = (await import('plotly.js-dist-min')).default

  // Generate non-uniform mesh points
  const xLines: any[] = []
  const yLines: any[] = []

  // X-direction: Fine near gate edges, coarse elsewhere
  const xPoints = [
    -80, -70, -60, -55, -52, -50, -48, -46, -44, -42, -40,
    -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40,
    42, 44, 46, 48, 50, 52, 55, 60, 70, 80
  ]

  // Y-direction: Fine near surface, coarse in bulk
  const yPoints = [
    0, 0.5, 1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 80, 120
  ]

  // Vertical lines
  xPoints.forEach(x => {
    xLines.push({
      x: [x, x],
      y: [0, 120],
      mode: 'lines',
      line: { color: 'rgba(59, 130, 246, 0.3)', width: 1 },
      showlegend: false,
      hoverinfo: 'skip'
    })
  })

  // Horizontal lines
  yPoints.forEach(y => {
    yLines.push({
      x: [-80, 80],
      y: [y, y],
      mode: 'lines',
      line: { color: 'rgba(59, 130, 246, 0.3)', width: 1 },
      showlegend: false,
      hoverinfo: 'skip'
    })
  })

  // Gate region (oxide)
  const gateTrace = {
    x: [-45, 45, 45, -45, -45],
    y: [0, 0, -5, -5, 0],
    fill: 'toself',
    fillcolor: 'rgba(96, 165, 250, 0.5)',
    line: { color: '#3b82f6', width: 2 },
    name: 'Gate Oxide',
    hoverinfo: 'name'
  }

  // Source region
  const sourceTrace = {
    x: [-80, -50, -50, -80, -80],
    y: [0, 0, 40, 40, 0],
    fill: 'toself',
    fillcolor: 'rgba(239, 68, 68, 0.3)',
    line: { color: '#ef4444', width: 1 },
    name: 'Source (n+)',
    hoverinfo: 'name'
  }

  // Drain region
  const drainTrace = {
    x: [50, 80, 80, 50, 50],
    y: [0, 0, 40, 40, 0],
    fill: 'toself',
    fillcolor: 'rgba(239, 68, 68, 0.3)',
    line: { color: '#ef4444', width: 1 },
    name: 'Drain (n+)',
    hoverinfo: 'name'
  }

  const traces = [...xLines, ...yLines, gateTrace, sourceTrace, drainTrace]

  Plotly.newPlot(chartRef.value, traces, {
    margin: { t: 30, r: 30, b: 50, l: 60 },
    xaxis: {
      title: 'x (nm)',
      range: [-90, 90],
      gridcolor: 'rgba(128,128,128,0.1)'
    },
    yaxis: {
      title: 'z (nm)',
      range: [130, -10],
      gridcolor: 'rgba(128,128,128,0.1)'
    },
    annotations: [
      { x: 0, y: -2.5, text: 'Gate', showarrow: false, font: { size: 10 } },
      { x: -65, y: 20, text: 'Source', showarrow: false, font: { size: 10 } },
      { x: 65, y: 20, text: 'Drain', showarrow: false, font: { size: 10 } },
      { x: 0, y: 80, text: 'p-Si Substrate', showarrow: false, font: { size: 10 } }
    ],
    showlegend: false,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 11 }
  }, { responsive: true, displayModeBar: false })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 350px;"></div>
</template>
