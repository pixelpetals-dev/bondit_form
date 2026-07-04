# Deploying the Bond It Pre-Coating Inspection prototype

This is a **fully client-side static site** (Next.js `output: "export"`). It has no
backend, database, or Node process at runtime — every route is prerendered to
HTML and the form logic, calculations, scoring, and auto-save all run in the
browser (`localStorage`). That makes it trivial and cheap to host: just serve
the `out/` folder from any web server.

## Deploying with Dokploy (recommended — Git → build → live)

The repo ships a `Dockerfile` (multi-stage: builds the static export, serves it
with nginx). Dokploy builds it straight from GitHub.

1. In Dokploy → **Create → Application**.
2. **Provider:** GitHub → repository `pixelpetals-dev/bondit_form`, branch `main`.
3. **Build Type:** `Dockerfile` (Dokploy auto-detects the `Dockerfile` at the repo root).
4. **Port:** `80` (the nginx container listens on 80).
5. **Domain:** add your domain/subdomain under the app's Domains tab — Dokploy's
   Traefik handles the reverse proxy and issues the HTTPS certificate automatically.
6. **Deploy.** Every push to `main` can auto-redeploy (enable the webhook/auto-deploy
   toggle in Dokploy).

No env vars, database, or volumes are needed for this phase.

---

## Manual alternative (plain nginx, no Docker)

> When the later phases land (PDF generation, email, admin portal), this switches
> to a Node deployment — see "Later: switching to a Node server" at the bottom.

## 1. Build the deployable folder

On your machine (or CI):

```bash
cd bondit-inspection-form
npm ci          # clean install
npm run build   # produces ./out
```

The artifact to ship is the **`out/`** directory. Nothing else from the repo is
needed on the server.

## 2. Upload to the VPS

Copy `out/` to the server (adjust host/user/path):

```bash
# from your machine, inside bondit-inspection-form/
rsync -avz --delete out/ USER@YOUR_VPS_IP:/var/www/bondit/
# or: scp -r out/* USER@YOUR_VPS_IP:/var/www/bondit/
```

## 3. nginx server block

`/etc/nginx/sites-available/bondit` (Hostinger VPS ships nginx or you install it
with `apt install nginx`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name inspection.example.com;   # <-- your domain (or _ for IP-only)

    root /var/www/bondit;
    index index.html;

    # Routes are exported as folders (trailingSlash), e.g. /wizard/index.html
    location / {
        try_files $uri $uri/ $uri/index.html /index.html;
    }

    # Long-cache the hashed build assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache the HTML entry points
    location = /index.html { add_header Cache-Control "no-cache"; }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/bondit /etc/nginx/sites-enabled/bondit
sudo nginx -t          # test config
sudo systemctl reload nginx
```

## 4. HTTPS (recommended before sharing with Bond It)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d inspection.example.com
```

Certbot edits the server block to add TLS and sets up auto-renewal.

## 5. Redeploy after changes

```bash
npm run build
rsync -avz --delete out/ USER@YOUR_VPS_IP:/var/www/bondit/
# no service restart needed — nginx serves the new files immediately
```

## Notes for this phase

- **Per-device data.** Answers are saved in the browser's `localStorage`. Nothing
  is sent to a server; there is no shared storage or admin yet. Good for a
  clickable prototype / demo; not the production data path.
- **Uploads** preview in-session only (no upload backend this phase).
- Works on any hostname or bare IP — nothing is hard-coded to a domain.

## Later: switching to a Node server

When PDF/email/admin arrive, remove `output: "export"` from `next.config.ts`,
then run the app as a Node process behind nginx:

```bash
npm run build
npm run start                       # serves on :3000
# keep it alive with PM2:
npm i -g pm2
pm2 start "npm run start" --name bondit
pm2 save && pm2 startup
```

…and change the nginx `location /` to `proxy_pass http://127.0.0.1:3000;`.
