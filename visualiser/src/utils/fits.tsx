import React from "react";
import classNames from "classnames";
import { APP_URL } from "./global";
import { request } from "./request";
import { store } from "../redux/store";
import { setApp } from "../redux/reducers/app";
import { TbWaveSine } from "react-icons/tb";
import { AppFile, outputFileExists } from "./files";
import { Tooltip } from "react-tooltip";

/**
 * Type for response from the fits_info API
 * @promerty _axe - [ columns, lines ]
 */
export type FitsInfo = { 
    _axes: [number,number]
};

export const fetchFit = async(path: string, index: number = 0) =>{
    let formdata = new FormData();
    formdata.append("path", path.replace(/^\//,''))
    if(index) 
        formdata.append("index", index.toString())
    return (await request(`${APP_URL}/science-api/read_fits`, { method: 'post', data: formdata })).data
}


export const fetchFitsInfo = async(config:{ path?: string, file?: File }): Promise<FitsInfo[]> =>{
    let formdata = new FormData();
    if(!config.file && !config.path) throw "fetchFitsInfo: missing input";
    if(config.path)
        formdata.append("path", config.path.replace(/^\//,''))
    else if(config.file)
        formdata.append("file", config.file)
    return (await request(`${APP_URL}/science-api/fits_info`, { method: 'post', data: formdata })).data
}

export const getPlotOperation = (baseDir: string, idx: number, input?: { initspec: number, finalspec: number }, offset?: number) => {
    let { app } = store.getState()
    if (
        ( input ? idx >= input.initspec && idx <= input.finalspec : true )
        && 
        ( offset !== undefined ? idx >= offset : true )
    ){
        let index = offset ?
            idx - offset
        :
            input 
                ? idx - input.initspec 
                : idx; 
        return (
            <>
                <div
                    className={classNames({
                        "table-operation": true,
                        "selected": (
                            (baseDir && app.plotSpectrum?.folder === baseDir)
                            && app.plotSpectrum?.index === index
                        )
                    })}
                    onClick={() => {
                        store.dispatch(setApp({
                            plotSpectrum: {
                                index, folder: baseDir
                            }
                        }))
                    }}
                    data-tooltip-html="Compare spectrum"
                >
                    <TbWaveSine />
                </div>
                <Tooltip 
                    anchorSelect=".table-operation"
                    className='spectrum-tooltip' 
                    place='bottom'
                />
            </>
        )
    }
}


export const checkOutputExists = (folder:string, files?: AppFile[]) =>{
    return (
        outputFileExists(`${folder}/plots/solutionInput.fits`, files)
        ||
        outputFileExists(`${folder}/plots/solutionInput.csv`, files)
    )
}
export const checkInputExists = (folder:string, files?: AppFile[]) =>{
    return outputFileExists(`${folder}/inputs/input.fits`, files)
}