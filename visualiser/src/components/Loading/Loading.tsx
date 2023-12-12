import React, { Component } from "react";
import "./Loading.css";
import { FiLoader } from 'react-icons/fi';
import LoadingIcon from "../LoadingIcon/LoadingIcon";

interface Props{
    message?: string
}
interface State{

}

export default class Loading extends Component<Props, State>{
    render (){
        return (
            <div className="loading">
                <LoadingIcon/>

                <label>{this.props.message || "Loading..."}</label>
            </div>
        )
    }
}