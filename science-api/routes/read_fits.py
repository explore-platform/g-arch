from fastapi import UploadFile, HTTPException, Body
from fastapi.responses import FileResponse
from typing import Optional
import os

from app import app
from astropy.io import fits
from astropy.table import Table
from scripts.config import OUTPUT_DIR

# temp_path = os.path.join(os.environ.get("SERVICE_OUTPUT_DATA"), 'test.fits')
# dest=os.path.join(os.environ.get("SERVICE_OUTPUT_DATA"), 'test.csv')

temp_path = os.path.join("/tmp", 'test.fits')
dest=os.path.join("/tmp", 'test.csv')

@app.post("/read_fits", status_code=200)
async def route_create_fits_csv(
    file: Optional[UploadFile] = None,
    index: int = Body(default=0),
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
        
    try:
        print(f"opening file {path}")

        # with fits.open(file.file.read(), memmap=True, ) as hdu_list:
        with fits.open(path, memmap=True, ) as hdu_list:
            print(f"hdu count {len(hdu_list)}")
            if(len(hdu_list) <= index):
                raise HTTPException(status_code=404, detail=f"The index {index} is out of range")
            
            # select the HDU you want
            hdu = hdu_list[index]
            print(hdu)
            
            # read into an astropy Table object
            table = Table(hdu.data)

            # write to a CSV file
            # table.stream
            table.write(
                dest, 
                delimiter=',', 
                format='ascii',
                overwrite=True
            )
        
        return FileResponse(
            path=dest,
            # media_type="text/csv"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail= str(e))
    
