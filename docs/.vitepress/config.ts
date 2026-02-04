import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  title: 'MOSFET Simulator',
  description: 'Interactive MOSFET Device Simulator Documentation',
  base: '/MOSFET-SIM/',

  head: [
    ['link', { rel: 'icon', href: '/MOSFET-SIM/favicon.ico' }],
  ],

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    },
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Physics', link: '/physics/overview' },
      { text: 'User Guide', link: '/guide/getting-started' },
    ],

    sidebar: {
      '/physics/': [
        {
          text: 'Physics',
          items: [
            { text: 'Overview', link: '/physics/overview' },
            { text: 'Level A - Analytical', link: '/physics/level-a' },
            { text: 'Level B - Semi-empirical', link: '/physics/level-b' },
            { text: 'Level C - Numerical', link: '/physics/level-c' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'User Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Device Parameters', link: '/guide/device-parameters' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/edwin-labs/MOSFET-SIM' },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },
})
