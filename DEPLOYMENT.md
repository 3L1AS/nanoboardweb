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

---

## Troubleshooting

### `KeyError: 'ContainerConfig'` during rebuild
If you see an error like `ERROR: for nanoboardweb 'ContainerConfig'` followed by a Python traceback referencing `docker-compose`, this is a known bug in older versions of `docker-compose` (like v1.29) when attempting to rebuild images over existing containers.

**Solution:** Delete the running container first before rebuilding:
```bash
docker rm -f nanoboardweb
docker-compose up -d --build
```
