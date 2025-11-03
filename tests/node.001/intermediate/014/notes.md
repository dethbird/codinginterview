Awesome—here’s a tight “gold answer” you can drop into your notes. It:

* Watches a directory **recursively** (works even where `recursive: true` isn’t supported, e.g., Linux).
* **Debounces** changes for 200 ms to collapse duplicate bursts.
* Prevents **overlapping builds**; if changes arrive during a build, it **queues exactly one** re-run.
* Handles new subdirectories at runtime.

---

# 14) File Watcher with Debounce Rebuild

```js
// watch-build.js
'use strict';
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DIR = process.argv[2] || '.';
const BUILD_CMD = process.env.BUILD_CMD || 'node build.js';
const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || 200);

let debounceTimer = null;
let buildRunning = false;
let rerunQueued = false;

// Track watchers so we can avoid duplicates and clean up if needed
/** @type {Map<string, fs.FSWatcher>} */
const watchers = new Map();

/**
 * Debounce signal → schedule (or reschedule) a build.
 */
function triggerBuild() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scheduleBuild, DEBOUNCE_MS);
}

/**
 * Start a build if idle; otherwise queue a single rerun.
 */
function scheduleBuild() {
  if (buildRunning) {
    rerunQueued = true;
    return;
  }
  runBuild();
}

/**
 * Execute the build command once. If changes arrive while building,
 * we'll run exactly one more time after this completes.
 */
function runBuild() {
  buildRunning = true;
  rerunQueued = false;

  const startedAt = new Date();
  console.log(`[watch] Running: ${BUILD_CMD} @ ${startedAt.toISOString()}`);

  const child = exec(BUILD_CMD, { maxBuffer: 10 * 1024 * 1024 });

  // Pipe child output to this process
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);

  child.on('exit', (code, signal) => {
    const finishedAt = new Date();
    const took = ((finishedAt - startedAt) / 1000).toFixed(2);
    if (signal) {
      console.log(`[watch] Build terminated by ${signal} (${took}s)`);
    } else {
      console.log(`[watch] Build exited with code ${code} (${took}s)`);
    }

    buildRunning = false;
    if (rerunQueued) {
      console.log('[watch] Changes arrived during build → running again…');
      scheduleBuild();
    }
  });

  child.on('error', (err) => {
    console.error('[watch] Failed to start build:', err);
    buildRunning = false;
    // If we failed to start, still honor queued rerun
    if (rerunQueued) scheduleBuild();
  });
}

/**
 * Add a watcher on a directory. Also recursively watch subdirectories.
 */
function watchDirRecursive(dir) {
  const abs = path.resolve(dir);
  if (watchers.has(abs)) return;

  try {
    const watcher = fs.watch(abs, (event, filename) => {
      // Any FS change triggers the debounce. We also try to detect new subdirs.
      triggerBuild();

      // On rename events, a file/dir may have been added/removed; if a new dir,
      // add a watcher recursively.
      if (event === 'rename' && filename) {
        const full = path.join(abs, filename.toString());
        fs.promises.stat(full).then((st) => {
          if (st.isDirectory()) {
            watchDirRecursive(full);
          }
        }).catch(() => { /* ignore: may be deleted */ });
      }
    });

    // If the watcher errors (e.g., permissions), log and continue
    watcher.on('error', (err) => {
      console.error(`[watch] Error on ${abs}:`, err.message);
      // Optionally: try re-adding after a delay
    });

    watchers.set(abs, watcher);

    // Also walk current subdirs once at startup for recursive coverage
    fs.promises.readdir(abs, { withFileTypes: true })
      .then(entries => {
        for (const d of entries) {
          if (d.isDirectory()) {
            watchDirRecursive(path.join(abs, d.name));
          }
        }
      })
      .catch(() => { /* ignore */ });

    console.log(`[watch] Watching: ${abs}`);
  } catch (err) {
    console.error(`[watch] Failed to watch ${abs}:`, err.message);
  }
}

/**
 * Start
 */
(async function main() {
  // Validate root dir
  try {
    const st = await fs.promises.stat(DIR);
    if (!st.isDirectory()) {
      console.error(`Not a directory: ${DIR}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`Cannot access ${DIR}:`, e.message);
    process.exit(1);
  }

  // Begin watching recursively (portable across platforms)
  watchDirRecursive(DIR);

  // Optional: initial build
  // scheduleBuild();
})();
```

---

## Why this passes tests

* **Debounce:** `triggerBuild()` uses a 200 ms timer so bursts (duplicate events per change) coalesce to one build.
* **Exec once:** `buildRunning` + `rerunQueued` ensure **no overlap**; if changes arrive mid-build, exactly **one** rerun happens.
* **Portable recursion:** Avoids relying on `fs.watch(..., { recursive: true })` (not available on Linux). We add watchers to every subdirectory and add new ones on `rename` when a dir appears.
* **Duplicate events:** Debounce collapses them naturally.
* **Process reuse:** The runner reuses a single process slot; next run only starts after exit.

---

## Notes / edge cases

* **Huge trees:** Many subdirectories = many watchers. For very large repos, prefer a library like `chokidar` (polling + native fallbacks).
* **Ignoring paths:** Add a filter (e.g., skip `node_modules`, `.git`) before watching or before triggering the build.
* **Shell command safety:** `exec` uses the shell; treat `BUILD_CMD` as trusted (or switch to `spawn` with args).
* **Initial build:** Uncomment `scheduleBuild()` in `main()` if you want a build on startup.
* **maxBuffer:** set to 10 MB; increase if your build is very chatty.

---

## Tiny test ideas

* Touch multiple files quickly → expect **one** build run.
* Create a new subdirectory and file → watcher should pick it up and trigger a build.
* Start a long build, change a file during it → observe exactly **one** rerun after completion.
