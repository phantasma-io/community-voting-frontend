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

# Stop docker container
[group('docker')]
s:
    docker compose stop
