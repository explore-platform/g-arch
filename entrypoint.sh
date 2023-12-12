#!/bin/bash
echo "LAUNCHING SDA"
ls -la

# NGINX
service nginx start

# # Launch science api 
cd ./science-api && uvicorn app:app --host 0.0.0.0 --port 5000 --workers 3 --root-path ${PATH_PREFIX}science-api 2>&1 &
# bash -c "source /venv/science_env/bin/activate science_env && cd science && uvicorn app:app --host 0.0.0.0 --workers 3 --root-path ${PATH_PREFIX}science"

# Launch API
cd ./api && npm run run 2>&1

