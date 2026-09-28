import child_process from 'child_process'
import electron from 'electron'
import esbuild from 'esbuild'

const isDev = !process.argv.includes('--prod')

const electronRunner = (() => {
  let handle = null
  let pending = null
  return {
    restart () {
      console.info('Restarting Electron process.')

      // Kill the previous process AND wait for it to fully exit before spawning
      // a replacement. Spawning immediately would briefly run two Electron
      // instances, which fight over the single-instance lock and the HTTP port.
      if (handle) {
        handle.removeAllListeners('exit')
        handle.kill()
      }
      if (pending) clearTimeout(pending)

      pending = setTimeout(() => {
        pending = null
        handle = child_process.spawn(electron, ['.'], {
          stdio: 'inherit'
        })
        // If Electron exits on its own (crash), drop the handle so the next
        // rebuild spawns cleanly instead of killing a dead pid.
        handle.on('exit', () => {
          handle = null
        })
      }, 300)
    }
  }
})()

const visionBuild = await esbuild.build({
  entryPoints: ['src/vision/link-worker.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/vision.js'
})

const mainContext = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: !isDev,
  platform: 'node',
  external: ['electron', 'uiohook-napi', 'electron-overlay-window'],
  outfile: 'dist/main.js',
  define: {
    'process.env.STATIC': (isDev) ? '"../build/icons"' : '"."',
    'process.env.VITE_DEV_SERVER_URL': (isDev) ? '"http://localhost:5173"' : 'null'
  },
  plugins: (isDev) ? [{
    name: 'electron-runner',
    setup (build) {
      build.onEnd((result) => {
        if (!result.errors.length) electronRunner.restart()
      })
    }
  }] : []
})

if (isDev) {
  await mainContext.watch()
} else {
  await mainContext.rebuild()
  mainContext.dispose()
}
