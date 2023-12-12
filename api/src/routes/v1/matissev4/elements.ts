import * as fs from 'fs';
import * as path from 'path'
import { SCIENCE_DATA_DIR } from '../../../utils/science';

// export const ElementsConfig = {
//     "Ca": { files: 7 },
//     "Ce": { files: 7 },
//     "Cr": { files: 1 }
// }


export type ElementsConfig = {
    [element:string]: { files: number }
}

export const getElementsConfig = (): ElementsConfig =>{
    let files = fs.readdirSync(path.join(SCIENCE_DATA_DIR, "Grid5d"));

    let config = {};
    let total = 0;

    for(let f of files){
        if(f.startsWith("Ultimate_")){
            if(f.endsWith(".fits")){
                let el = f.replace("Ultimate_", "").replace(".fits","").replace(/\_[0-9]+/,"");
                if(el){
                    if(!(el in config)) config[el] = { files: 1 };
                    else config[el].files++;

                    total++;
                }
            }
        }
    }

    console.log("total", total)

    return config;
}