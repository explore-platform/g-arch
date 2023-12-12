import { setApp } from "../redux/reducers/app"
import { store } from "../redux/store"
import { APP_URL, requestError } from "./global"
import { request } from "./request"

export const fetchElements = async() =>{
    try{
        store.dispatch(setApp({
            elements: (
                await request(`${APP_URL}/api/v1/matissev4/elements`)
            ).data.value
        }))
    }
    catch(e){
        requestError(e)
    }
}