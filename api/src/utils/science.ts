import * as path from 'path';
import * as fs from 'fs';
import { AppError } from './express';

export const SCIENCE_DATA_DIR = path.join(process.env["SERVICE_APP_DATA"], '/science/MARCS');
export const CONFIG_DIR = path.join(process.env["SERVICE_APP_DATA"], '/config');

export const OUTPUT_DIR = {
    "plots": "plots",
    "debug": "debug",
    "inputs": "inputs",
}
export const OUTPUT_FILES = {
    "outputText": "output.txt",
    "reconstructed": "reconstructed.fits",
    "evolutions": "evolutions.txt",
}

export const getOutputFilePath = (file?: string, options?:{
    checkExists?: boolean
}) =>{
    // let filePath = path.join(process.env["SERVICE_OUTPUT_DATA"], file || '');
    let filePath = path.join(process.env["SERVICE_USER_APP_DATA"], file || '');
    if(options?.checkExists && !fs.existsSync(filePath)){
        throw new AppError(400, `The file ${file} does not exist.`);
    }
    return filePath;
}