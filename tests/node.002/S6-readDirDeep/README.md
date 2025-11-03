# S6 — `readDirDeep(root, {filter, followSymlinks, sameDevice})`

Goal: Async generator yielding file paths recursively. Avoid cycles when following symlinks; `sameDevice` fence.
