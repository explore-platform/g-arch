from fastapi import UploadFile, HTTPException, Body
from fastapi.responses import FileResponse
from typing import Optional
import os
from app import app
from astropy.io import fits
from astropy.table import Table
from scripts.config import OUTPUT_DIR

temp_path = os.path.join("/tmp", 'test.fits')

@app.post("/fits_info", status_code=200)
async def route_create_fits_csv(
    file: Optional[UploadFile] = None,
    path: Optional[str] = Body(default=None),
):   
    print("file", file)
    print("path", path)
    if(not path and not file):
        raise HTTPException(status_code=400, detail=f"Missing file or path to file")
    
    if(file is not None):
        path = temp_path
        with open(path, 'wb') as f:
            f.write(file.file.read())
    else:
        path = os.path.join(OUTPUT_DIR, path)
        
    if(not os.path.exists(path)):
        raise HTTPException(status_code=404, detail=f"file path does not exist: {path}")
        
    print(f"opening file {path}")

    try:
        # with fits.open(file.file.read(), memmap=True, ) as hdu_list:
        with fits.open(path, memmap=True, ) as hdu_list:
            print(f"hdu count {len(hdu_list)}")
            
        
            return hdu_list
    except Exception as e:
        raise HTTPException(status_code=400, detail= str(e))
    
