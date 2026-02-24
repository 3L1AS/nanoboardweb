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

Edit the `docker-compose.yml` to set your desired password and ensure the volume paths match your setup:
- Change `NANOBOARDWEB_PASSWORD` to a secure password.
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
Open your web browser and navigate to:
`http://<YOUR_VPS_IP>:8080`

Log in using the password you set as `NANOBOARDWEB_PASSWORD`. From here, you can start, stop, view logs, and configure the Nanobot entirely via the web interface.
