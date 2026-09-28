<script setup>
import { useData, withBase, useRoute } from 'vitepress'

const { site, theme, page } = useData()
const route = useRoute()

const isHome = () => route.path === withBase('/') || route.path === withBase('/index.html')
</script>

<template>
  <div class="pk-shell">
    <header class="pk-header">
      <a :href="withBase('/')" class="pk-logo">
        <img src="pathname:///favicon.png" alt="POE Kitten" />
        <span>{{ site.title }}</span>
      </a>
      <nav class="pk-nav">
        <a :href="withBase('/download')">Download</a>
        <a :href="withBase('/quick-start')">Quick Start</a>
        <a :href="withBase('/faq')">FAQ</a>
        <a class="pk-gh" :href="theme.github.releasesUrl">GitHub</a>
      </nav>
    </header>

    <main :class="isHome() ? 'pk-main-home' : 'pk-main'">
      <!-- Home gets a hero; docs pages keep the sidebar layout -->
      <template v-if="isHome()">
        <section class="pk-hero">
          <div class="pk-hero-text">
            <h1>
              <span class="pk-spark">🎀</span>
              POE&nbsp;Kitten
            </h1>
            <p class="pk-tagline">
              A modern all-in-one <b>Path of Exile 2</b> overlay — price checks,
              item checks, stash search, cheat sheets, a session HUD and analytics.
            </p>
            <div class="pk-actions">
              <a class="pk-btn pk-btn-primary" :href="withBase('/download')">⬇ Download</a>
              <a class="pk-btn" :href="withBase('/quick-start')">Quick Start</a>
              <a class="pk-btn" :href="theme.github.releasesUrl">Latest release</a>
            </div>
            <p class="pk-meta">v{{ theme.appVersion }} · Windows · Linux · macOS</p>
          </div>
          <div class="pk-hero-art">
            <img src="pathname:///showcase.png" alt="POE Kitten tool showcase" />
          </div>
        </section>

        <section class="pk-features">
          <h2>What it does</h2>
          <div class="pk-grid">
            <div class="pk-card">
              <span class="pk-ic">💰</span>
              <h3>Price check</h3>
              <p>Hover an item and press your hotkey. Headline price, live listings, an item preview, and one-click whisper / offer / cross-currency buttons.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">🗺</span>
              <h3>Item check</h3>
              <p>A waystone's value plus a plain-English danger score, so you know what you're walking into before you open the map.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">📦</span>
              <h3>Stash search</h3>
              <p>Map rolling and dump sorting. Set stat filters and matches get highlighted straight in your stash.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">🖼</span>
              <h3>Cheat sheets</h3>
              <p>Pin reference images as a scrollable strip that sits over the game. Scroll to cycle, hold to peek.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">⏱</span>
              <h3>Session HUD</h3>
              <p>Always visible, even with the overlay closed. Playtime, area timer, deaths, level pace and XP gain.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">📊</span>
              <h3>Companion &amp; analytics</h3>
              <p>A browser dashboard with your live session, whisper inbox and trade queue, plus heatmaps and per-item stats from your local history.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">🔔</span>
              <h3>Alerts &amp; Trade Copilot</h3>
              <p>Toasts, text-to-speech and an optional Discord webhook for whispers, deaths and level-ups. Queue buyers with Invite / Sold / Gone.</p>
            </div>
            <div class="pk-card">
              <span class="pk-ic">🎀</span>
              <h3>Kuromi Mode</h3>
              <p>Dark purple and hot pink, rounded Y2K type, expressive motion — on Tailwind 4, Vue 3.5 and shadcn-vue.</p>
            </div>
          </div>
        </section>

        <section class="pk-cta">
          <h2>Ready to try it?</h2>
          <p>Download POE Kitten, launch Path of Exile 2 once so it writes its logs, then open the dashboard with <code>Shift</code> + <code>Space</code> and enable <b>Read client log</b> in Settings.</p>
          <div class="pk-actions">
            <a class="pk-btn pk-btn-primary" :href="theme.github.releasesUrl">Download for free</a>
            <a class="pk-btn" href="https://github.com/HakkuPantsu/poe-kitten/blob/master/CREDITS.md">Credits</a>
          </div>
        </section>
      </template>

      <template v-else>
        <div class="pk-doc-wrap">
          <nav class="pk-sidebar">
            <template v-for="group, i in theme.sidebar">
              <template v-for="item in group.items">
                <a
                  :class="['pk-sideitem', { active: route.path.startsWith(withBase(item.link)) }]"
                  :href="withBase(item.link)"
                  >{{ item.text }}</a
                >
              </template>
              <hr v-if="i < theme.sidebar.length - 1" />
            </template>
          </nav>
          <article class="markdown-body pk-article">
            <Content />
          </article>
        </div>
      </template>
    </main>

    <footer class="pk-footer">
      <p>
        POE Kitten — created by
        <a href="https://github.com/HakkuPantsu">HakkuPantsu</a>, for SirMelvinTheNonce.
      </p>
      <p class="pk-fine">
        Based on <a href="https://github.com/Kvan7/Exiled-Exchange-2">Exiled Exchange 2</a>
        by Kvan7, which descends from
        <a href="https://github.com/SnosMe/awakened-poe-trade">Awakened PoE Trade</a>
        by SnosMe. Not affiliated with Grinding Gear Games.
      </p>
    </footer>
  </div>
</template>

<style lang="postcss">
@import url('./style.css');
</style>
