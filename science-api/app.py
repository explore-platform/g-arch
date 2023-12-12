from fastapi import FastAPI
import os

app = FastAPI()

import routes.create_fits
import routes.read_fits
import routes.fits_info

@app.get("/")
@app.get("/v1/")
async def root():
    return {
        "message": "Hello World",
        # Test that the VENV still has access to the host envs
        "path_prefix": os.environ.get('PATH_PREFIX')
    }

    