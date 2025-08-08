**pm2-and-systemd.md**

# PM2 & systemd (running Node in production)

## 📌 What & why

You need your Node app to **start on boot**, **restart on crash**, and **roll with deploys**. Two common approaches:

- **PM2**: Node-focused process manager with clustering, envs, logs, and zero-downtime reloads.
- **systemd**: OS-level service manager (Linux). Rock-solid for boot, restart policies, resource limits, and logging (journald).

Use **PM2** when you want Node ergonomics (cluster mode, `pm2 reload`, `pm2 logs`). Use **systemd** when you want OS-native control or to supervise **PM2 itself**.

------

## PM2 basics (what you’ll actually use)

### Install & quick start

```bash
npm i -g pm2
pm2 start dist/server.js --name api -i max    # cluster across CPU cores
pm2 save                                       # save current process list
pm2 startup                                    # generate systemd unit to resurrect on boot
```

**Common args/params**

- `-i <n|max>`: cluster mode processes.
- `--name`: friendly name.
- `--env <name>`: pick env block from ecosystem file.
- `--watch`: restart on file changes (dev only).
- `--time`: timestamp logs.

### `ecosystem.config.js` (recommended)

```js
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/server.js',
    instances: 'max',            // or a number
    exec_mode: 'cluster',        // enables round-robin across instances
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'info'
    },
    max_memory_restart: '400M',  // auto-restart if RSS exceeds
    out_file: '/var/log/api/out.log',
    error_file: '/var/log/api/err.log',
    merge_logs: true,
    kill_timeout: 10000,         // give app time to shutdown gracefully
    wait_ready: true,            // use process.send('ready')
    listen_timeout: 10000
  }]
};
```

**Zero-downtime deploys**

```bash
pm2 start ecosystem.config.js --env production
pm2 reload api            # graceful reload, keep traffic flowing
pm2 status
pm2 logs api
```

**Graceful shutdown (important)**

```ts
// server.ts
const server = app.listen(process.env.PORT || 3000);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
```

**Health checks**

- Add `/health` route; pair with external monitor (ALB, Nginx, uptime tool).
- With `wait_ready: true`, signal readiness:

```ts
// after server.listen(...)
if (process.send) process.send('ready');
```

**Log rotation**

- Use PM2 module:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

Or send logs to stdout and let the platform handle rotation.

**PM2 in Docker**

- Use `pm2-runtime` (no daemon):

```dockerfile
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
```

**Cheat sheet**

```bash
pm2 start|restart|reload|stop api
pm2 delete api
pm2 logs api --lines 100
pm2 env 0                    # show env of process 0
pm2 monit                    # top-like dashboard
pm2 save && pm2 resurrect    # persist/restore process list
```

------

## systemd (service unit) — run Node as a native service

### Create a unit

```
/etc/systemd/system/api.service
[Unit]
Description=My API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Environment=NODE_ENV=production
EnvironmentFile=-/etc/api/env           # optional: load more envs
WorkingDirectory=/var/www/api
ExecStart=/usr/bin/node dist/server.js
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5
# Resource/limits:
LimitNOFILE=65535
# Ensure graceful stop:
KillSignal=SIGTERM
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
sudo systemctl daemon-reload
sudo systemctl enable api
sudo systemctl start api
sudo systemctl status api
journalctl -u api -f
```

**Environment management**

- Put secrets in `/etc/api/env` (chmod 600; owned by `www-data` if needed).
- Example:

```
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=...
```

**Reload vs restart**

- `systemctl reload api` → sends `HUP` (implement handler if needed).
- `systemctl restart api` → full restart.

**Log rotation**

- Default: journald (`journalctl -u api`). Configure retention via `/etc/systemd/journald.conf`.

**Binding low ports (<1024)**

- Use a reverse proxy (Nginx) **or** give capability:

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node
```

(Prefer the proxy.)

------

## PM2 vs systemd (when to pick which)

| Need                   | PM2                           | systemd                                        |
| ---------------------- | ----------------------------- | ---------------------------------------------- |
| Node cluster mode      | ✅ built-in                    | ❌ (use multiple services or external LB)       |
| Zero-downtime reload   | ✅ `pm2 reload`                | ⚠ requires your app to implement reload signal |
| Log management         | Files/pm2-logrotate or stdout | journald (native)                              |
| Start on boot          | `pm2 startup` (wraps systemd) | ✅ native                                       |
| Docker best-practice   | `pm2-runtime` (ok)            | Usually **not** (one process per container)    |
| Simplicity on plain VM | ✅                             | ✅ (often simpler)                              |

**Hybrid**: run your app under **PM2**, and use **systemd to keep PM2 alive**:
 `/etc/systemd/system/pm2-www-data.service`

```ini
[Unit]
Description=PM2 process manager for www-data
After=network.target

[Service]
Type=simple
User=www-data
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/local/bin/pm2 resurrect
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill
Restart=always

[Install]
WantedBy=multi-user.target
```

------

## Realistic deployment flow (VM)

1. Build artifact: `npm ci && npm run build`.
2. Sync to server: `rsync` or CI deploy.
3. Write/update env file in `/etc/api/env`.
4. `systemctl restart api` **or** `pm2 reload api`.
5. Verify: health check + `journalctl -u api -n 100`.

------

## Common pitfalls (and fixes)

- **App doesn’t stop on deploy** → no SIGTERM handler. *Add graceful shutdown as shown.*
- **PM2 cluster overloads DB** → each worker has its own pool. *Lower pool size per worker or don’t over-cluster.*
- **Logs fill disk** → enable pm2-logrotate or use journald with retention.
- **`pm2 startup` didn’t persist** → forgot `pm2 save`.
- **Using root** → run as a **non-root** user (`www-data`), fix file permissions.
- **NVM path issues under systemd** → point `ExecStart` to the **absolute node path** or set `Environment=PATH=...`.

------

## ✅ Interview Tips

- “I use **PM2** for Node ergonomics (cluster, zero-downtime `reload`, logrotate module) and **systemd** for OS-level reliability.”
- “On shutdown I handle **SIGTERM** and call `server.close()` with a timeout to drain connections.”
- “Each cluster worker multiplies **DB/Redis pool** usage; I tune pools accordingly.”
- “In Docker I prefer **one process per container**; if multiple Node processes are needed, use **pm2-runtime**.”
- “For boot persistence: `pm2 save` + `pm2 startup` or a **systemd service** with `Restart=on-failure`.”