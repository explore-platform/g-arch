import { Star } from "../components/StarSelect/StarSelect";
import { store } from "../redux/store";

export const StarIdRegex = /^[0-9]{19}$/;

export const isStarIDList = (list: string[]) =>{
    return  StarIdRegex.test(list[0]);
}
export const checkStarList = (list: string[]) =>{
    let { stars } = store.getState().app;
    
    return list.every((s)=> stars && s.match(StarIdRegex) && stars.find((star)=> star.id === s )  ) 
}