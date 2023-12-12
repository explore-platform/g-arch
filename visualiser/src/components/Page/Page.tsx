import React, { Component } from "react";
import classNames from "classnames";
import "./Page.css";

interface Props{
    id?: string
    children?: any
}

export default class Page extends Component<Props>{

    render (){
        return (
            <div 
                id={this.props.id}
                className={classNames({
                    "page": true
                })}
            >
                { this.props.children }
            </div>
        )
    }
}