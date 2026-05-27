# Docker Guide

The Dockerfile supports two targets: **development** (with hot reload) and **production** (optimized).

## Development

Build and run with hot reload:

**Linux/macOS:**
```bash
docker build --target development -t motzklist-admin:dev .
docker run -p 3001:3001 --env-file .env.local -v $(pwd)/src:/app/src motzklist-admin:dev
```

**Windows PowerShell:**
```powershell
docker build --target development -t motzklist-admin:dev .
docker run -p 3001:3001 --env-file .env.local -v "${PWD}/src:/app/src" motzklist-admin:dev
```

**Windows CMD:**
```cmd
docker build --target development -t motzklist-admin:dev .
docker run -p 3001:3001 --env-file .env.local -v "%cd%/src:/app/src" motzklist-admin:dev
```

## Production

Build and run optimized image:

```bash
docker build --target production -t motzklist-admin:prod .
docker run -p 3001:3001 --env-file .env.local motzklist-admin:prod
```

Or pass environment variables directly:

```bash
docker run -p 3001:3001 \
  -e API_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_API_URL=/api \
  -e SESSION_SECRET=your-secret-here \
  motzklist-admin:prod
```

## Build Arguments

For production builds, you can pass build-time environment variables:

```bash
docker build --target production \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  -t motzklist-admin:prod .
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Use a different port: `-p 3002:3001` |
| Hot reload not working | Verify volume mount points to `src` directory |
| Can't reach API | Use `host.docker.internal` instead of `localhost` |
| API URL not set | Ensure `--env-file .env.local` is included in the run command |

For full-stack development, use Docker Compose from the main project repository.
