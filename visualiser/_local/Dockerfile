FROM node:18.12.1

WORKDIR /sda/visualiser/
ENTRYPOINT export VITE_BUILD_DATE=$(date +%Y-%m-%dT%H:%M:%S) && npm i && npm run dev