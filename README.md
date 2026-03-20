# Map (Sensors) — Full‑stack demo

This repository contains:
- **Frontend**: React + Vite + Leaflet(bib js pour affichage des cartes) (`frontend/`) served on **:3000**
- **Backend**: Node.js + Express + MongoDB (`backend/`) served on **:5000**
- **MongoDB**: initialization script + indexes (`mongo/`)
- **Dataset**: station metadata CSV (`backend/data/PeMSD7_M_Station_Info.csv`)


## Screen Shots from the project

![Accueil](docs/images/cart.jpg)
![imagesDocker](docs/images/cart2.jpg)


## Project structure

- `frontend/`: Vite app (React, Leaflet)
- `backend/`: Express API that loads the CSV into MongoDB and serves:
  - `GET /api/stations`
  - `GET /api/links`
  - `GET /api/health`
  - `data/`: CSV file imported by the backend at startup
- `mongo/`: Mongo image + `init.js` creating DB/indexes

## Prerequisites

- **Node.js 20+** and npm (for local dev), or **Docker** (for containers)

## Local development (no Docker)

### 1) Start MongoDB (recommended: Docker volume, no local install)

You don’t need to install MongoDB on your machine. Run it in Docker with a **named volume** (data persists across container restarts):

PowerShell:

```bash
docker volume create sensors-mongo-data
docker run -d --name mongo -p 27017:27017 `
  -v sensors-mongo-data:/data/db `
  -v "${PWD}\mongo\init.js:/docker-entrypoint-initdb.d/init.js:ro" `
  -e MONGO_INITDB_DATABASE=sensorsdb `
  mongo:7
```

PowerShell (one line):

```bash
docker run -d --name mongo -p 27017:27017 -v sensors-mongo-data:/data/db -v "${PWD}\mongo\init.js:/docker-entrypoint-initdb.d/init.js:ro" -e MONGO_INITDB_DATABASE=sensorsdb mongo:7
```

Bash (Git Bash / WSL / Linux / macOS):

```bash
docker volume create sensors-mongo-data
docker run -d --name mongocart -p 27017:27017 \
  -v sensors-mongo-data:/data/db \
  -v "$(pwd)/mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro" \
  -e MONGO_INITDB_DATABASE=sensorsdb \
  mongo:7
```

### 2) Start the backend

```bash
cd backend
npm install
$env:MONGO_URI="mongodb://localhost:27017"
npm start
```

Notes:
- Backend listens on `http://localhost:5000`
- Backend imports `data/PeMSD7_M_Station_Info.csv` into DB `sensorsdb` at startup.

### 3) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend listens on `http://localhost:3000`.

## Docker (build + run)

This repo includes separate Dockerfiles for each service. If you are not using `docker compose`, you can run them manually on a shared network.

Tip: for MongoDB persistence, use a named volume (example below).

### 1) Network + Mongo

```bash
docker network create cartNetwork
docker volume create sensors-mongo-data
docker run -d --name mongocart --network cartNetwork -p 27017:27017 `
  -v sensors-mongo-data:/data/db `
  -v "${PWD}\mongo\init.js:/docker-entrypoint-initdb.d/init.js:ro" `
  -e MONGO_INITDB_DATABASE=sensorsdb `
  mongo:7
```

### 2) Backend

```bash
docker build -t backendcart -f backend/Dockerfile .
docker run -d --name backendcart --network cartNetwork-net -p 5000:5000 -e MONGO_URI="mongodb://mongo:27017" backendcart
```

### 3) Frontend

```bash
docker build -t frontendcart ./frontend
docker run -d --name sensors-frontend --network cartNetwork -p 5173:5173 frontendcart
```

## Configuration

- **Backend**
  - `MONGO_URI` (optional): defaults to `mongodb://mongo:27017`
  - Port: fixed to `5000`

## Troubleshooting

- **Mongo connection fails**: ensure `MONGO_URI` points to the right host (`localhost` for local, `mongo` for Docker network).
- **Ports already in use**: stop the process using `5173`, `5000`, or `27017`, or remap ports with `-p HOST:CONTAINER`.

