import * as express from 'express';
import * as fs from 'fs';

import { AppError, formatResponse } from '../../../utils/express';
import { getOutputFilePath, OUTPUT_FILES } from '../../../utils/science';
import * as dirTree from 'directory-tree';

const router = express.Router();

router.get('/', (req:express.Request , res, next)=>{
    formatResponse(req, res,{
        statusCode: 200,
        content: {
            value: dirTree(getOutputFilePath())
        }
    })
})

// router.get('/:file', (req:express.Request , res, next)=>{    
//     let { file } = req.params;
//     if(!(file in OUTPUT_FILES)) throw new AppError( 400, `Invalid file name ${file}`, { help: { validFiles: Object.keys(OUTPUT_FILES) } });
//     res.sendFile(
//         getOutputFilePath(OUTPUT_FILES[file], { checkExists: true })
//     )
// });

router.get('/*', (req:express.Request , res, next)=>{    
    let file = req.params['0'] ? req.params['0'] : '';

    // if(!(file in OUTPUT_FILES)) throw new AppError( 400, `File does not exist ${file}` });
    res.sendFile(
        getOutputFilePath(file, { checkExists: true })
    )
});
router.delete('/*', (req:express.Request , res, next)=>{    
    let file = req.params['0'] ? req.params['0'] : '';
    let outputPath = getOutputFilePath(file, { checkExists: true });
    
    fs.rmSync(outputPath, { recursive: true, force: true });

    formatResponse(req, res, {
        statusCode: 200,
        content: {
            message: `Successfuly removed file ${file}`
        }
    })
});

export default router;