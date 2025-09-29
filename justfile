[private]
just:
    just -l

# Run in debug mode
[group('run')]
r:
    npm run dev

# Deploy docker container
[group('docker')]
d:
    docker compose up -d --build

# Deploy docker container (force)
[group('docker')]
dc:
  docker compose build --no-cache --pull
  docker compose up -d --force-recreate

# Stop docker container
[group('docker')]
s:
    docker compose stop
