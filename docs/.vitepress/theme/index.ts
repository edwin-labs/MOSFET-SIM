import DefaultTheme from 'vitepress/theme'
import './custom.css'

import IVChart from './components/IVChart.vue'
import CVChart from './components/CVChart.vue'
import BandDiagram from './components/BandDiagram.vue'
import ModelComparison from './components/ModelComparison.vue'
import MeshDiagram from './components/MeshDiagram.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('IVChart', IVChart)
    app.component('CVChart', CVChart)
    app.component('BandDiagram', BandDiagram)
    app.component('ModelComparison', ModelComparison)
    app.component('MeshDiagram', MeshDiagram)
  }
}
