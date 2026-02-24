# Deploying NanoboardWeb to Hostinger VPS (Docker)

This guide explains how to deploy the NanoboardWeb web application using Docker, running it side-by-side with your existing Nanobot container.

## Prerequisites
- **Docker** and **Docker Compose** installed on your Hostinger VPS.
- Your Nanobot Docker image ready to be used.

---

## Deployment Steps

This approach uses Docker Compose to seamlessly connect NanoboardWeb to the Nanobot container, sharing volumes and docker socket permissions securely.

### 1. Upload the Project
Upload the NanoboardWeb project directory (including the `Dockerfile` and `server/` folder) to your VPS. 

For convenience, you can clone the repository directly if it's public:
```bash
git clone https://github.com/3L1AS/nanoboardwebweb.git
cd nanoboardwebweb
```

### 2. Configure Docker Compose
Create a `docker-compose.yml` file in the root directory. You can use the provided example as a template:

```bash
cp docker-compose.example.yml docker-compose.yml
nano docker-compose.yml
```

Edit the `docker-compose.yml` to set your desired password and ensure the volume paths match your setup:
- Change `NANOBOARDWEB_PASSWORD` to a secure password.
- Ensure the volume `/root/.nanobot:/root/.nanobot` points to where you want the Bot's configuration and workspaces stored. This **must** be exactly the same path for both `nanoboardweb` and `nanobot` services in the file.

### 3. Build and Run
Build the NanoboardWeb image and start both containers in the background:

```bash
docker-compose up -d --build
```

### 4. Verify Success
Check that both containers are running smoothly:
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
