# Docker Sample Project - Additive Compose Files

This project keeps the full-stack Docker sample idea:

- backend service
- frontend service
- `data` folder
- Docker named volume for persisted backend data
- bind mounts for development
- backend healthcheck
- environment file
- multi-stage backend Dockerfile using `node:22-alpine`
- frontend Dockerfile using `nginx:alpine`

The important rule is this:

```text
compose.yaml is the base app.
compose.name.yaml adds the name input.
compose.address.yaml adds the address input.
```

The override files are **additive**. They do not replace each other because they set different environment variables.

## Project structure

```text
docker-sample-project-additive-compose/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.conf
├── data/
│   ├── address_changes.txt
│   └── name_changes.txt
├── compose.yaml
├── compose.name.yaml
├── compose.address.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── docker-compose.yml
├── configure.env
└── README.md
```

## Ports

Every command uses the same ports:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:3000
```

## 1. Run base app only

```bash
docker compose -f compose.yaml up --build
```

Open:

```text
http://localhost:8080
```

The page shows the base environment variable:

```text
OWNER_NAME=Sakib
```

No input field is shown yet.

## 2. Run base app + name input

```bash
docker compose -f compose.yaml -f compose.name.yaml up --build
```

Open:

```text
http://localhost:8080
```

The page shows:

```text
OWNER_NAME=Sakib
Name input field
```

Backend API:

```text
GET  http://localhost:3000/api/name
POST http://localhost:3000/api/name
```

## 3. Run base app + address input

```bash
docker compose -f compose.yaml -f compose.address.yaml up --build
```

Open:

```text
http://localhost:8080
```

The page shows:

```text
OWNER_NAME=Sakib
Address input field
```

Backend API:

```text
GET  http://localhost:3000/api/address
POST http://localhost:3000/api/address
```

## 4. Run base app + name input + address input

This is the important one.

```bash
docker compose -f compose.yaml -f compose.name.yaml -f compose.address.yaml up --build
```

Open:

```text
http://localhost:8080
```

The page shows:

```text
OWNER_NAME=Sakib
Name input field
Address input field
```

This works because the two override files add different environment variables:

```yaml
# compose.name.yaml
services:
  backend:
    environment:
      ENABLE_NAME_FIELD: "true"
```

```yaml
# compose.address.yaml
services:
  backend:
    environment:
      ENABLE_ADDRESS_FIELD: "true"
```

After Compose merges the files, the backend receives both:

```text
ENABLE_NAME_FIELD=true
ENABLE_ADDRESS_FIELD=true
```

## Inspect the final merged Compose config

Base + name:

```bash
docker compose -f compose.yaml -f compose.name.yaml config
```

Base + address:

```bash
docker compose -f compose.yaml -f compose.address.yaml config
```

Base + name + address:

```bash
docker compose -f compose.yaml -f compose.name.yaml -f compose.address.yaml config
```

## Development mode

Development mode adds bind mounts.

Base development:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

Development with name input:

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f compose.name.yaml up --build
```

Development with address input:

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f compose.address.yaml up --build
```

Development with both inputs:

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f compose.name.yaml -f compose.address.yaml up --build
```

## Stop containers but keep data volume

```bash
docker compose -f compose.yaml down
```

## Stop containers and delete named volume data

```bash
docker compose -f compose.yaml down -v
```

## How the volume is used

In normal mode, this line in `compose.yaml` creates a Docker named volume:

```yaml
volumes:
  - app-data:/app/data
```

The backend writes logs here:

```text
/app/data/name_changes.txt
/app/data/address_changes.txt
```

That is why name and address changes are kept even after containers restart.

In development mode, the local `data` folder is bind-mounted into the container:

```yaml
- ./data:/app/data
```

So in development mode, you can see the log files directly inside the project folder.

## Explanation for tech lead

The project has one backend and one frontend.

The base compose file starts both services and passes this env value to the backend:

```text
OWNER_NAME=Sakib
```

The frontend does not read Docker env variables directly. Instead, it calls the backend:

```text
GET /api/config
```

The backend returns the active config.

When only `compose.yaml` is used, the backend returns only the owner value, so the frontend shows:

```text
OWNER_NAME=Sakib
```

When `compose.name.yaml` is added, it adds this env variable:

```text
ENABLE_NAME_FIELD=true
```

So the frontend shows the name input.

When `compose.address.yaml` is added, it adds this env variable:

```text
ENABLE_ADDRESS_FIELD=true
```

So the frontend shows the address input.

When both override files are passed in the command, both env variables exist, so the frontend shows both input fields.
