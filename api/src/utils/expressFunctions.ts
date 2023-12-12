import { AppError } from "./express";

export const getMissingAttributes = (obj:object, attributes:Array<String> = []) => {
    let missing = []; 
    attributes.forEach((r:string)=>{
        if(!obj.hasOwnProperty(r)){
            missing.push(r);
        }
    });
    return missing;
}

export const checkRequiredAttributes = (obj:any, required:Array<string>=[]) =>{
    let missing = getMissingAttributes(obj, required);
    if(missing.length > 0){
        throw new AppError(
            400, 
            `Missing required Attributes ${missing.map((m:string)=>{return `'${m}'`}).join(', ')}`, {
            details: {
                required,
                missing
            }
        });
    } 
}