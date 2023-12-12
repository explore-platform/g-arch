import * as express from 'express';
import * as path from 'path';

// express libs
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as cors from 'cors';
import * as fileUpload from 'express-fileupload';
import routes from './routes/';
import { AppError, errorHandler, formatResponse } from './utils/express';

import { Server } from 'http';
import { initWebsocket } from './utils/websocket';

let app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('common'));
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(fileUpload({ 
    tempFileDir: "/tmp/",
    useTempFiles: true,
    createParentPath: true,
    // limits: { fileSize: 10 * 1024 * 1024 * 1024 },
}));
app.use(bodyParser.json());
app.use(routes);
app.get('/', (req, res, next)=>{
    return formatResponse(req, res, { content: { message: "Welcome to the API !" } });
})
app.get('/testError', (req, res, next)=>{
    throw new AppError(500, "Failed successfully", { details: "This was meant to test the error handling system" });
})
app.use(errorHandler);

export const server = new Server(app);
initWebsocket(server)
let port = process.env['port'] ? process.env['port'] : 3000;
server.listen(port,()=>{
    console.log(`Listening on port ${port}`);
}) 
