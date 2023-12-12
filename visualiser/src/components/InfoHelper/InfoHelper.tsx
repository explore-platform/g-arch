import React, { Component, ReactNode } from "react";
import "./InfoHelper.css";
import {  MdInfo } from "react-icons/md";
import { renderToStaticMarkup } from "react-dom/server";
import { Tooltip } from 'react-tooltip'



interface Props{
    children?: ReactNode
}
interface State{
}

export default class InfoHelper extends Component<Props, State>{
    render (){
        return (
            <>
                <div 
                    className="info-modal-button"
                    onClick={()=>{ 
                        this.setState({ open: true });
                    }}
                    data-tooltip-html={renderToStaticMarkup(<>{this.props.children}</>)}
                >
                    <MdInfo/>
                </div>
                <Tooltip 
                    clickable
                    anchorSelect=".info-modal-button"
                    className="info-tooltip" 
                    openOnClick 
                />
            </>

            
        )
    }
}