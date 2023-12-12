import Axios, { AxiosRequestConfig } from "axios"

export const request = async (url: string, params?: AxiosRequestConfig) => {
    return await Axios({ 
        url: url,
        ...(params || { method: 'get' })
    });
}