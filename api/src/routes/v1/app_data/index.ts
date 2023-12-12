import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppError } from '../../../utils/express';

const router = express.Router();

router.get('/*', (req:express.Request , res, next)=>{    
    let file = req.params['0'] ? req.params['0'] : '';

    let filePath = path.join(process.env["SERVICE_APP_DATA"], file || '');
    if(!fs.existsSync(filePath)){
        throw new AppError(400, `The file ${file} does not exist.`);
    }

    res.sendFile(filePath)
});

export default router;