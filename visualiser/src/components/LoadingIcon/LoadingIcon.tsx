import React, { Component } from "react";
import "./LoadingIcon.css";
import { FiLoader } from 'react-icons/fi';
import classNames from "classnames";

interface Props{
    white?: boolean
    size?: number
}
interface State{

}

export default class LoadingIcon extends Component<Props, State>{
    render (){
        return (
            <div 
                className={classNames({
                    "loading-icon": true,
                    "white": this.props.white
                })}
                style={{
                    fontSize: this.props.size
                }}
            >
                <FiLoader/>
            </div>
        )
    }
}