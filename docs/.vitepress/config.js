import { defineConfig } from 'vitepress'

// Must match the repo name: https://hakkupantsu.github.io/poe-kitten/
const BASE = '/poe-kitten/'

export default defineConfig({
  title: 'POE Kitten',
  description: 'A modern all-in-one Path of Exile 2 overlay — Kuromi Mode themed',
  base: BASE,
  mpa: true,
  head: [
    ['link', { rel: 'shortcut icon', type: 'image/png', href: `${BASE}favicon.png` }]
  ],
  markdown: {
    theme: 'light-plus',
    attrs: {
      leftDelimiter: '{:',
      rightDelimiter: '}'
    }
  },
  themeConfig: {
    // logo: 'TODO', https://github.com/vuejs/vitepress/issues/1401
    appVersion: '0.0.1',
    github: {
      releasesUrl: 'https://github.com/HakkuPantsu/poe-kitten/releases'
    },
    socialLinks: [
      {
        text: 'GitHub',
        color: '#181717',
        link: 'https://github.com/HakkuPantsu/poe-kitten'
      }
    ],
    sidebar: [
      {
        items: [{
          text: 'Download',
          link: '/download'
        }, {
          text: 'Quick Start',
          link: '/quick-start'
        }
        ]
      },
      {
        items: [{
          text: 'Chat commands',
          link: '/chat-commands'
        }, {
          text: 'OCR Guide',
          link: '/ocr-guide'
        }]
      },
      {
        items: [{
          text: 'Common issues',
          link: '/issues'
        }, {
          text: 'FAQ',
          link: '/faq'
        }]
      }
    ]
  }
})
