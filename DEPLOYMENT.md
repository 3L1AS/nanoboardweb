# Deploying NanoboardWeb to Hostinger VPS (Docker)

This guide explains how to deploy the NanoboardWeb web application using Docker, running it side-by-side with your existing Nanobot container.

## Prerequisites
- **Docker** and **Docker Compose** installed on your Hostinger VPS.
- Your **Nanobot container already running** independently on the VPS.

---

## Deployment Steps

This approach uses Docker Compose to run NanoboardWeb on its own. It seamlessly connects to your existing Nanobot container by sharing volumes and docker socket permissions securely.

### 1. Upload the Project
Upload the NanoboardWeb project directory (including the `Dockerfile` and `server/` folder) to your VPS. 

For convenience, you can clone the repository directly if it's public:
```bash
git clone https://github.com/3L1AS/nanoboardweb.git
cd nanoboardweb
```

### 2. Configure Docker Compose
Create a `docker-compose.yml` file in the root directory. You can use the provided example as a template:

```bash
cp docker-compose.example.yml docker-compose.yml
nano docker-compose.yml
```

Edit the `docker-compose.yml` to set your secrets and ensure the volume paths match your setup:
- Change `NANOBOARDWEB_PASSWORD` to a secure password.
- Set `JWT_SECRET` to a long random secret string (required for secure token signing).
- Ensure `NANOBOT_CONTAINER_NAME` exactly matches the name of your already running nanobot container (e.g., `nanobot`).
- Ensure the volume `/root/.nanobot:/root/.nanobot` points to where you currently have the Bot's configuration and workspaces stored.

### 3. Build and Run
Build the NanoboardWeb image and start the container in the background:

```bash
docker-compose up -d --build
```

### 4. Verify Success
Check that the dashboard container is running smoothly:
```bash
docker-compose ps
```

You can view the logs for the dashboard if needed:
```bash
docker logs nanoboardweb
```

### 5. Access the Dashboard
Do not expose the dashboard directly over plain HTTP on the public internet.

Recommended setup:
- Bind the container port to localhost or a private network only.
- Put Nginx / Caddy / Traefik in front of it with HTTPS (TLS).
- Restrict access further with firewall rules, VPN, or IP allowlisting where possible.

Then open your browser to your HTTPS endpoint (for example):
`https://<YOUR_DOMAIN>`

Log in using the password you set as `NANOBOARDWEB_PASSWORD`. From here, you can start, stop, view logs, and configure the Nanobot entirely via the web interface.

### Example: Localhost Bind + Nginx/Caddy (Recommended)

Update your `docker-compose.yml` so NanoboardWeb is not directly exposed to the internet:

```yaml
ports:
  - "127.0.0.1:8080:8080"
```

This makes the dashboard reachable only from the VPS itself. Your reverse proxy (Nginx/Caddy) will then expose it securely on `443`.

### Example: Firewall (UFW)

Allow SSH + HTTPS, and block direct access to port `8080`:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8080/tcp
sudo ufw enable
sudo ufw status
```

### Example: Nginx Reverse Proxy with IP Allowlist

Replace `board.example.com` and the `allow` IPs with your own values:

```nginx
server {
    listen 443 ssl http2;
    server_name board.example.com;

    # Configure your TLS certs (Let's Encrypt or your existing certs)
    ssl_certificate /etc/letsencrypt/live/board.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/board.example.com/privkey.pem;

    location / {
        # Optional but recommended: IP allowlist
        allow 203.0.113.10;   # Home IP
        allow 198.51.100.25;  # Office IP
        deny all;

        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Example: Caddy Reverse Proxy with IP Allowlist

Replace `board.example.com` and allowed IPs with your own values:

```caddy
board.example.com {
    @blocked not remote_ip 203.0.113.10 198.51.100.25
    respond @blocked 403

    reverse_proxy 127.0.0.1:8080
}
```

### Example: VPN-Only Access (Best for Admin Dashboards)

If you use Tailscale or WireGuard:
- Keep NanoboardWeb bound to `127.0.0.1:8080`
- Expose it only through a reverse proxy reachable from your VPN
- Do not create a public DNS record unless you also enforce IP allowlisting

This significantly reduces exposure compared to a public login page.

---

## Troubleshooting

### `KeyError: 'ContainerConfig'` during rebuild
If you see an error like `ERROR: for nanoboardweb 'ContainerConfig'` followed by a Python traceback referencing `docker-compose`, this is a known bug in older versions of `docker-compose` (like v1.29) when attempting to rebuild images over existing containers.

**Solution:** Delete the running container first before rebuilding:
```bash
docker rm -f nanoboardweb
docker-compose up -d --build
```
