from fastapi import FastAPI, UploadFile, Body, HTTPException, Query
from typing import List, Optional
import os
from scripts.createfits import CreateFITS
from app import app
from scripts.config import OUTPUT_DIR

# csv_upload_path="/tmp/temp.csv"
gaia_path=os.path.join(os.environ.get('SERVICE_APP_DATA'), "science", "RVS", "GAIA_ID.csv")
spectra_path=os.path.join(os.environ.get('SERVICE_APP_DATA'), "science", "RVS", "spectra.fits")
csv_upload_name="temp.csv"


# FOR TESTING
csv_upload_path=os.path.join(OUTPUT_DIR, "test")
csv_upload_file_path=os.path.join(csv_upload_path, csv_upload_name)
    
@app.post("/create_fits", status_code=201)
async def route_create_fits(
    folder:str,
    byStarName: Optional[bool] = Query(default=False)
):  
    print(folder)
    return create_fits(folder, byStarName)



@app.post("/create_fits_csv", status_code=201)
async def route_create_fits_csv(
    file: UploadFile,
    byStarName: Optional[bool] = Query(default=False)
):    
    if(not os.path.exists(csv_upload_path)):
        os.mkdir(csv_upload_path)
    print(f"Creating temp file at {csv_upload_file_path}...")
    with open(csv_upload_file_path, 'wb') as f:
        f.write(file.file.read())
        
    return create_fits(byStarName=byStarName)
    
    
    
@app.post("/create_fits_json", status_code=201)
async def route_create_fits_json(
    body: List[str] = Body(),
    byStarName: Optional[bool] = Query(default=False)
):
    if(not os.path.exists(csv_upload_path)):
        os.mkdir(csv_upload_path)
        
    print(f"Creating temp file at {csv_upload_file_path}...")
    with open(csv_upload_file_path, 'wb') as f:
        f.write( bytes('\n'.join(body), encoding='utf8') )
        
    return create_fits(byStarName=byStarName)
    
    
def create_fits(folder:str = "test", byStarName: bool = False):
    
    # try:
    print(f"Generating fits file")
    
    # print(os.listdir(os.environ.get('SERVICE_APP_DATA')))
    output_path=os.path.join(OUTPUT_DIR, folder)
    input_csv=os.path.join(output_path, csv_upload_name)
    
    if(not os.path.exists(input_csv)):
        raise HTTPException(status_code=404, detail=f" input not found: {input_csv}")
    else:
        print(f"file exists: {input_csv}")
        
    print(f"\
        resolve={byStarName} \n\
        gaia_fits={spectra_path} \n\
        gaia_csv={gaia_path} \n\
        target_csv= {input_csv} \n\
        output_base={output_path} \n\
    ")
    CreateFITS(
        resolve=byStarName,
        gaia_fits=spectra_path,
        gaia_csv=gaia_path,
        target_csv= input_csv,
        output_base=output_path,
        output_name="input.fits"
    )
    # finally: 
    #     print(f"Removing temp file at {csv_upload_path}...")
    #     os.unlink(csv_upload_path)
    
    return {
        "message": "Generated fits file"
    }
    
    