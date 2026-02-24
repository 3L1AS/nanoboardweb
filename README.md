<div align="center">

# NanoboardWeb

A lightweight, web-based management dashboard for Nanobot.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

- **Visualize** - From config files to system resources, session logs to skill memories, visualize everything about your nanobot!
- **Convenient** - Move away from complex CLI operations. Manage and monitor through an intuitive web interface.
- **Universal** - Access your dashboard from anywhere via a web browser. Deploy easily with Docker alongside your existing nanobot instance.
- **Lightweight** - Built with Node.js, Express, and React. Low resource footprint.

## Features

- **Dashboard**: System resource monitoring and nanobot status.
- **Sessions & Workspace**: Multi-channel message viewing, Markdown rendering, and file management.
- **Logs**: Real-time log streaming using Socket.IO direct from the Docker container.
- **Skills & Memory**: Visual management, toggle skills, edit/delete memories.
- **Scheduled Tasks**: Manage automated cron tasks.
- **Settings**: Visual configuration editor with fast editing.

## Quick Start (Docker Deployment)

The easiest way to run NanoboardWeb is via Docker Compose, running it directly alongside your Nanobot instance.

### 1. Configure Docker Compose
Create a `docker-compose.yml` file. You can find an example template in `docker-compose.example.yml`.

Ensure that:
- Your `NANOBOARDWEB_PASSWORD` is set to a secure password.
- Both `nanoboardweb` and `nanobot` services mount the exact same volume (e.g., `/root/.nanobot:/root/.nanobot`).
- The docker socket `/var/run/docker.sock` is mounted so NanoboardWeb can control the Nanobot container.

### 2. Start Services
```bash
docker-compose up -d --build
```

### 3. Access Dashboard
Navigate to `http://<YOUR_VPS_IP>:8080` in your web browser and log in with your configured password.

For detailed deployment instructions, please see [DEPLOYMENT.md](DEPLOYMENT.md).

## Local Development

If you want to run or build the project locally for development:

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Setup & Run
```bash
# Install dependencies for the workspace and server
npm install

# Start the React development server
npm run dev

# (Optional) In another terminal, compile and run the backend server
cd server
npm run build
npm start
```
*Note: Since the backend relies on Docker commands to manage Nanobot, some features will only function fully if run on the host actually running the nanobot container.*

### Build
```bash
npm run build
```
This compiles the TypeScript Node.js backend to `server/dist/` and builds the React frontend statics to `dist/`.

## Project Structure

```
nanoboardweb/
├── src/                    # React Frontend Source
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page views
│   ├── lib/                # API client (fetch/socket.io)
│   ├── App.tsx             # Main App frontend routing
│   └── main.tsx            # Frontend Entry
├── server/                 # Node.js + Express Backend
│   ├── src/                # Backend Source
│   │   ├── routes/         # API routes (auth, process, fs, system)
│   │   └── index.ts        # Express/Socket.io Server Entry
│   ├── package.json        # Backend Dependencies
│   └── tsconfig.json       # TypeScript configuration
├── DEPLOYMENT.md           # VPS Deployment Guide
├── Dockerfile              # Docker build specification
├── docker-compose.example.yml
├── package.json            # Root workspace configuration
└── README.md               # Project documentation
```

## Acknowledgements
- Migrated to Web by [3L1AS](https://github.com/3L1AS).
- Originally the Tauri desktop app created by [freakz3z](https://github.com/freakz3z/nanoboard).
- Built to manage [nanobot](https://github.com/HKUDS/nanobot).
