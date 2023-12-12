import { setApp } from "../redux/reducers/app"
import { store } from "../redux/store"
import { APP_URL } from "./global"
import { request } from "./request"

/**
 * @type name Name of the file or folder
 * @type path Full path of the file or folder
 * @type children Folder's content, in it's abscence it's a file
 */
export type AppFile = {
    children?: AppFile[]
    name: string
    path: string
}

export const fetchProperties = async(folder: string) =>{
    let res = await request(`${APP_URL}/api/v1/output/${folder}/inputs/settings.properties`)

    let properties:{ [property:string]: string } = {};
    (res.data as string).split('\n').forEach((row) => {
        let [ property, value ] = row.split(/\s{0,1}=\s{0,1}/)
        properties[property] = value;
    });

    return properties;
}

export const fetchAppData = async(path: string) =>{
    return (await request(`${APP_URL}/api/v1/app_data${path.startsWith('/') ? '' : '/'}${path}`)).data;
}


export const fetchStarsList = async() =>{
    try{
        let res = await fetchAppData('science/RVS/GAIA_ID.csv');
        // let res = await request(`${APP_URL}/api/v1/app_data/science/RVS/GAIA_ID.csv`);

        let stars:any = (res as string).split('\n');
        stars.shift();

        stars = stars.map((r: string)=>{
            let [ 
                , id 
                // , name 
            ] = r.split(/\s*\,\s*/);
            return {
                id, 
                // name
            }
        })

        store.dispatch(setApp({
            stars
            // : (new Array(201).fill(null)).map((_, idx)=>{ return { id: (++idx).toString() } })
        }))
    }
    catch(e){
        console.error("error fetching stars", e);
    }


}

export const fetchCSV = async(path: string) =>{
    let formdata = new FormData();
    formdata.append("path", path.replace(/^\//,''))
    return (await request(`${APP_URL}/api/v1/output/${path}`)).data
}


export const getBaseDir = (path:string) =>{
    return path.split('/')?.[path.startsWith('/') ? 1 : 0];
}

export const getFileName = (path: string) =>{
    let split = path.split('/');
    return split[split.length - 1];
}

export const outputFileExists = (path: string, files?: AppFile[]) =>{
    if(!files) files = store.getState().files.files;
    let split = path.split('/')
    if(path.startsWith('/')) split.shift();
    if(path.endsWith('/')) split.pop();

    if(files){
        let folder:AppFile[]|undefined = files;
        // console.log("SEARCHING OUTPUT FILE", path)
        // console.log("split", split)
        // console.log("folder", folder)
        for(let i = 0 ; i < split.length ; i++){
            // console.log(`${i} | checking ${split[i]}`)
            let findFile:AppFile|undefined = folder?.find((f)=>f.name === split[i])
            // console.log(`${i} | findFile`, findFile)
            if( !findFile ) return false;
            if( findFile.children ) folder = findFile.children;
            else if (i !== split.length - 1) return false;
        }
        return true;

    }
    else{
        return false;
        console.log('no files yet')
    }
}