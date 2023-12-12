import { setFiles } from "../redux/reducers/files"
import { store } from "../redux/store"
import { AppFile } from "./files"
import { checkInputExists, checkOutputExists } from "./fits"
// import { outputFileExists } from "./files"
import { APP_URL, requestError } from "./global"
import { request } from "./request";

export type PlotableFolder = string;



export const getOutputFilePath = (folder: string, ext:string = "fits") =>{
    // let { files } = store.getState().files;
    // const _folder = files?.find((f)=> f.name === folder);
    // if(
    //     _folder &&
    //     _folder.children?.find((f)=> f.name === "plots" )?.children?.find((f)=> f.name === "solutionInput.csv")
    // ){
    //     return `${folder}/plots/solutionInput.csv`
    // }
    // return `${folder}/plots/solutionInput.fits`


    return `${folder}/plots/solutionInput.${ext}`
}
export const getInputFilePath = (folder: string, ext:string = "fits") =>{
    return `${folder}/inputs/input.${ext}`
}
export const getNormalizedFilePath = (folder: string, ext:string = "fits") =>{
    return `${folder}/plots/normalized.${ext}`;
}
export const getNormalizedFilePath_old = (folder: string, ext:string = "fits") =>{
    return `${folder}/plots/normalizedInput.${ext}`;
}

export const fetchFiles = async() =>{
    try{
        let files:AppFile[] = (
            await request(`${APP_URL}/api/v1/output`)
        ).data.value?.children;

        let plotableFolders:string[] = [];
        for(let f of files){
            // console.log(`Checking ${f.name} - input ${checkInputExists(f.name)} output: ${checkOutputExists(f.name)}`)
            if(
                checkInputExists(f.name, files) &&
                checkOutputExists(f.name, files)
            )
                plotableFolders.push(f.name)
        }
        console.log(plotableFolders)

        store.dispatch(setFiles({
            files,
            plotableFolders
        }))


        // for(let t of [
        //     "2023-03-23T17-01-37/inputs/input.fits", // true
        //     "2023-03-23T17-01-37/inputs/", // true
        //     "2023-03-23T17-01-37/inputss/", // false
        //     "2023-03-23T17-01-37/reconstructed.fits", // true
        //     "/2023-03-23T17-01-37/reconstructed.fits", // true
        //     "2023-03-23T17-01-37", // true
        //     "/2023-03-23T17-01-37", // true
        //     "/2023-03-23T17-01-37/", // true
        //     "2023-03-23T17-01-37/", // true
        // ])
        //     console.log(`${t} exits ? : ${outputFileExists(t)}`)
    }
    catch(e){
        requestError(e)
    }
}