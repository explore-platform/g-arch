import classNames from 'classnames';
import React,{Component} from 'react';

import './TableSearchInput.css';

interface Props{
    value: string
    onChange: (e:any)=>void
}
interface State{
    focused: boolean
}


export default class TableSearchInput extends Component<Props,State>{
    state = {
        focused: false
    }
    render(){
        return (
            <div className={classNames({ "table-search-input": true, "focused": this.state.focused })}>
                <i className="fas fa-search"/>
                <input
                    onFocus={()=>{ this.setState({ focused:true }) }}
                    onBlur={()=>{ this.setState({ focused:false }) }}
                    type="text"
                    value={this.props.value}
                    onChange={this.props.onChange}
                />
                
            </div>
        );
    }

};