// export const APP_URL = window.location.href;
// export const APP_URL = ".";
export const APP_URL = window.location.pathname.replace(/\/$/,'');
export const MATISSE_VERSION = "V4.9.34"


export const nullUndefined = (any: any) => {
    return any === null || any === undefined;
}


export const requestError = (error: any) =>{
    console.error(error)
}