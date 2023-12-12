import { Request, Response } from "express";
import { log } from "./logging";

export const formatResponse = (req: Request, res: Response, 
    data: {
        statusCode?: number,
        content: any
    }
) =>{
    return res.status(data.statusCode || 200).json({
        code: data.statusCode || 200,
        ...data.content
    })
}

export const errorHandler = (e:any, req: Request, res: Response, next) =>{
    if(e instanceof AppError){
        return e.handleExpress(req, res);
    }
    else{
        console.error(e);
        return new AppError(500, `UNHANDLED ERROR - ${e}`, { details: e }).handleExpress(req, res);
    }
}

export type AppErrorType = {
    // code:number
    // message: string
    details?: any
    help?: any,
    method?: "get"|"post"|"delete"|"put"|"patch"|"GET"|"POST"|"DELETE"|"PUT"|"PATCH"
}
export class AppError{
    code:number
    message:string
    details?:any
    help?:any
    method?:string

    constructor(code: number, message: string|null|undefined, e?:AppErrorType){
        let {
            // code,
            // message,
            details,
            help,
            method
        } = e || {};

        this.code = code;
        this.message = message;
        this.details = details;
        this.help = help;
        this.method = method;
    }

    handleExpress = (req:Request, res:Response) =>{
        log.error(`${this.method ? `${this.method.toUpperCase()} ` :''}${this.code} - ${this.message}`, {})

        return formatResponse(req, res, { 
            statusCode: this.code, 
            content:{
                code: this.code,
                error: this.message,
                details: this.details,
                help: this.help
            } 
        })
    }

}
