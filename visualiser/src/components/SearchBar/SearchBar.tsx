import React, { Component } from "react";
import "./SearchBar.css";
import classNames from "classnames";
import { FiSearch } from "react-icons/fi";

type Value = string

interface Props {
    value?: Value
    onChange: (value: Value)=>void
}
interface State {
    focused: boolean
}


export default class SearchBar extends Component<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            focused: false,
        }
    }
    render (){
        return (
            <div className={classNames({ "search-bar": true, "focused": this.state.focused})}>
                <div className="search-bar-icon">
                    <FiSearch/>
                </div>
                <input
                    onFocus={()=>this.setState({ focused: true })}
                    onBlur={()=>this.setState({ focused: false })}
                    value={this.props.value}
                    className="search-bar-input"
                    onChange={(e)=>{ this.props.onChange(e.target.value);  }}
                />
            </div>
        )
    }
}
