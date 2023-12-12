import { execSync } from 'child_process';
import { AppError } from './express';


/**
 * 
 * @returns JSON containing system memory info in KB or Integer
 */
export const get_memory_info = () =>{
    try{
        // const mem_info = execSync('free -m')?.toString();
        const mem_info = execSync('cat /proc/meminfo')?.toString();

        let info:any = {};
        mem_info.split('\n').map((line: string)=>{
            try{
                if(line){
                    let _line = line.replace(/\s+/g, ';');
                    let split = _line.split(';');
                    let [ key, value ] = split;
                    info[key.split(':')[0]] = parseInt(value);
                }
            }
            catch(e){
                console.error('error while parse', e);
            }
        })
        // console.log("info", JSON.stringify(info, null, 4))
        return info;
    }
    catch(e){
        throw new AppError(500, "Issue occured when fetching system memory");
    }
}