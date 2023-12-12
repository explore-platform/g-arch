import * as express from 'express';
import { AppError, formatResponse } from '../../../utils/express';
import { checkRequiredAttributes } from '../../../utils/expressFunctions';
// import PROPERTIES from 'properties';
import { parse, stringify } from 'properties'
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { websocket } from '../../../utils/websocket';
import { DEV_MODE, JAVA_SCRIPT_PATH } from '../../../utils/config';
import { log } from '../../../utils/logging';
import { exec, ChildProcess, execSync, spawnSync } from 'child_process';
import { v4 } from 'uuid';
import { CONFIG_DIR, getOutputFilePath, OUTPUT_DIR, OUTPUT_FILES, SCIENCE_DATA_DIR } from '../../../utils/science';
import { getElementsConfig } from './elements';
import axios, { AxiosRequestConfig } from 'axios';
import { get_memory_info } from '../../../utils/os';

var execution:ChildProcess;

const MODE = "777";

const DEBUG = true;

const stopProcess = () =>{
    if(!execution) return;
    else{
        let pid = execution.pid + 1;
        console.log("STOPPING", pid);
        try{
            execSync(`kill -s KILL ${pid}`)
            console.log("kill success")
            // websocket.emit('script_stop');
            // execution = null;
        }
        catch(e){
            throw new AppError(500, 'Process termination error', { details: e.toString() })
            // console.log("kill failed", e)
        }
    }
}

const router = express.Router();


const createFits = async (folder: string, byStarName: boolean = false)=>{
    try{
        console.info(`Fetching data from ${DEV_MODE ? "science-api:5000" : "0.0.0.0:5000"}`)
        await axios({
            url:`http://${DEV_MODE ? "science-api:5000" : "0.0.0.0:5000" }/create_fits`,
            method: 'post',
            params:{
                folder: folder + `/${OUTPUT_DIR.inputs}`,
                byStarName
            }
        })
    }
    catch(e){
        // console.error(e);
        console.error(e.response?.data || e)
        // throw e;
        throw new AppError(500, 'request error', { details: e.response?.data || e.toString() })
    }
}

router.post('/', async(req:any , res, next)=>{
    let cleanUp;
    try{
        if(execution) throw new AppError(409, `A process is already running.`);
        let { body } = req;

        let config = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'config.json'), 'utf-8'))

        let { outputFolder, byStarName } = body;
        let outputPath = getOutputFilePath(outputFolder)
        console.info(`Creating folder ${outputPath}`)
        if(outputFolder){
            delete body.outputFolder;
            try{
                fs.mkdirSync(outputPath, { mode: MODE })
            } catch(e){}
        }

        if(byStarName !== undefined)
            delete body.byStarName;
        
        


        // DISABLED ATM SINCE NO REQUIRED PROPERTIES
        // checkRequiredAttributes(req.body, [ '' ])

        // ================================================================
        // ------ CREATE PLOTS FOLDER
        // ================================================================

        let plots_subdir = path.join(outputPath, OUTPUT_DIR.plots);
        // TEMP FIX
        console.info(`Creating folder ${plots_subdir}`)
        try{
            fs.mkdirSync(plots_subdir, { mode: MODE })
        } catch(e){}


        // ================================================================
        // ------ FETCH INPUT FILE
        // ================================================================
        let input_file_name = 'input.fits';
        let input_subdir = path.join(outputPath, OUTPUT_DIR.inputs);
        let input_path = path.join(input_subdir, input_file_name)

        console.info(`Creating folder ${input_subdir}`)
        try{
            fs.mkdirSync(input_subdir, { mode: MODE })
        } catch(e){}

        let { inputList } = body;
        let input_file = req.files?.input;
        if(!(input_file || inputList)){
            throw new AppError(400, `Missing input file of fits or csv format or inputList in the body with list of stars`);
        }
        if(inputList){
            console.info("Using input list method")
            delete body.inputList;
            if(typeof inputList === "string") inputList = JSON.parse(inputList);
            fs.writeFileSync(
                path.join(input_subdir, "temp.csv"),
                inputList.join("\n")
            )
            console.info(`Resolve (byStarName) ${byStarName}`)
            await createFits(outputFolder, byStarName)
        }
        else{
            console.info(`Input file ${JSON.stringify(input_file)}`)
            
            if(input_file.mimetype === "text/csv"){
                input_file.mv(path.join(input_subdir, "temp.csv"))
                console.info(`Resolve (byStarName) ${byStarName}`)
                await createFits(outputFolder, byStarName)
            }
            else{
                input_file.mv(input_path);
            }
        }
        
        // ================================================================
        // ------ GENERATE SETTINGS
        // ================================================================
        
        const settings = {
            ...require('./default_settings.json'),
            "gaia.matisse.data_dir": SCIENCE_DATA_DIR,
            // WHILE AWAITING PROPER SOLUTION
            "gaia.matisse.spectra_subdir": input_subdir,
            "gaia.matisse.spectra_filename": input_file_name,
            
            // OUTPUT FILES
            // text
            "gaia.matisse.OutputFile": getOutputFilePath(path.join(outputFolder, OUTPUT_FILES.outputText)),
            "gaia.matisse.reconstruction.saved": true,
            "gaia.matisse.reconstruction_filename": getOutputFilePath(path.join(outputFolder, OUTPUT_FILES.reconstructed)),
            // "gaia.matisse.evolution_filename": getOutputFilePath(path.join(outputFolder, OUTPUT_FILES.evolutions)),

            // plots
            "gaia.matisse.plot_directory": plots_subdir,
            // "gaia.matisse.plot_directory": getOutputFilePath(path.join(outputFolder, OUTPUT_DIR.plots)),
            // "gaia.matisse.plot_directory": path.join(input_subdir, OUTPUT_DIR.plots),


            // "gaia.matisse.is_plot_visible": true,
            // "gaia.matisse.is_plot_visible": true,
        }


        // log.debug(`settings before : ${JSON.stringify(settings, null, 4)}`)
        if(body){
            Object.entries(body).map(([ key, value ])=>{
                if([ 'elements' ].includes(key)) return;
                else settings[`gaia.matisse.${key}`] = value;
            })
        }

        if(
            !settings[`gaia.matisse.is_grid_elements_use`]
            || settings[`gaia.matisse.is_grid_elements_use`] === "false"
        ){
            delete settings[`gaia.matisse.elements_filename_list`];
            delete settings[`gaia.matisse.grid_elements_filename_list`];
        }
        else if( "elements" in body){
            const lineListExecName = "UltimateLineListExec.txt";

            let elements: string[] = body.elements.split(',');
            settings["gaia.matisse.elements_filename_list"] = lineListExecName;

            const ElementsConfig = getElementsConfig();

            const elementsPath = path.join(SCIENCE_DATA_DIR, 'Grid5d');

            const lineListContent = fs.readFileSync(
                path.join(elementsPath, 'UltimateLineList.txt'),
                { encoding: 'utf-8' }
            ).split('\n')
            let lineListExecContent = "";


            for(let [ el, { files } ] of Object.entries(ElementsConfig)){
                if(!(elements.includes(el))) continue;

                let grid_elements = [];
                let spectra_elements = [];
                let capitalised = el.toUpperCase();
                for(let i = 0 ; i < files ; i++ ){
                    grid_elements.push(`${capitalised}${i}:Ultimate_${el}.param`);
                    spectra_elements.push(`${capitalised}${i}:Ultimate_${el}_${i}.fits`);
                }

                for(let line of lineListContent){
                    if(line.match(new RegExp(`^${capitalised}[0-9]+`)))
                        lineListExecContent += `${line}\n`;
                }

                // console.log("grid_elements", grid_elements)
                // console.log("spectra_elements", spectra_elements)
                
                settings["gaia.matisse.grid_elements_filename_list"] = grid_elements.join(',')
                settings["gaia.matisse.spectra_elements_filename_list"] = spectra_elements.join(',')

            }

            // GENERATE UltimateLineListExec.txt
            console.info(`Generating UltimateLineListExec.txt`)
            fs.writeFileSync(path.join(elementsPath, lineListExecName), lineListExecContent);
        }
        // Remove 
        // log.debug(`settings after : ${JSON.stringify(settings, null, 4)}`)

        // GENERATE PROEPERTIES FILE
        let propertiesPath = path.join( input_subdir, 'settings.properties');
        console.info(`Generating protpertie file ${propertiesPath}`)
        fs.writeFileSync( propertiesPath, stringify(settings));


        // ================================================================
        // ------ RUN SCRIPT AND SEND LOGS TO UI
        // ================================================================
        // exec(`echo "testing" >> ${path.join(process.env["SERVICE_OUTPUT_DATA"], 'test.txt')}`);
        // execution = exec(`echo "testing"`);
        // execution = exec(`/temp/input_data/test.sh`);
        
        let memory = config.RAM || (Math.floor(get_memory_info()["MemAvailable"] / 1024) - 512);
        console.log(`Executing Matisse with ${memory}m RAM`);
        execution = exec(`java -jar -Xmx${memory}m ${JAVA_SCRIPT_PATH} ${propertiesPath}`);
        websocket.emit('script_start');
        execution.stdout.on('data', (data)=>{
            websocket.emit('script_message', data.toString());
            console.log("[EXEC OUPUT]", data)
        })
        execution.stderr.on('data', (data)=>{
            websocket.emit('script_message', data.toString());
            console.log("[EXEC PROC ERROR]", data)
        })
        execution.addListener('exit', (exitCode)=>{
            websocket.emit('script_stop', exitCode);
            console.log("[EXEC FINISHED]", exitCode);
            execution = null;
            // // Check if files exist
            // Object.entries(OUTPUT_FILES).forEach(([ key, value ])=>{
            //     try{
            //         if(fs.existsSync(getOutputFilePath(value))){
            //             websocket.emit('file_exists', key)
            //         }
            //     }
            //     catch(e){}
            // })
            // cleanUp();
        });
        
        return formatResponse(req, res, {
            content:{
                message: "The Matisse v4 script is now running."
            }
        })
    }
    catch(e){
        cleanUp?.();
        
        next(e);
    }
    


});


router.delete('/', (req:any , res, next)=>{
    try{
        if(!execution) throw new AppError(404, `No process is running.`);

        stopProcess();

        return formatResponse(req, res, {
            content:{
                message: "Stopped execution"
            }
        })
    }
    catch(e){
        throw e;
    }


});



router.get("/elements", (req, res, next)=>{
    let elements = getElementsConfig();

    formatResponse(req, res, {
        statusCode: 200,
        content: {
            value: Object.keys(elements) 
        }
    })
})


// let r = fs.readFileSync('/sda/science/conf/example.properties');
// // console.log("r", r.toString())
// let json = JSON.stringify(parse(r.toString()), null, 4);
// console.log("json", json);
// fs.writeFileSync(`${path.join(process.env["SERVICE_OUTPUT_DATA"], 'settings.json')}`, json)

export default router;