import * as express from 'express';
import app_data from './app_data';
import matissev4 from './matissev4'
import output from './output'

const router = express.Router();

router.use('/matissev4', matissev4);
router.use('/output', output);
router.use('/app_data', app_data);

export default router;