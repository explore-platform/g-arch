import React,{ Component, Fragment } from 'react';
import { SelectInputField } from '../InputField/InputField';
import './SelectFilter.css';

interface Props{
    filters: Array<string>
    values: Array<string>

    label?: string|React.ReactNode
    onChange?: (values:Array<any>) => void
    placeholder?: string

    difference_mode?:boolean
}
interface State{
}


export default class SelectFilter extends Component<Props,State>{
    constructor(props:Props){
        super(props);
        this.state={
        }
    }

    render(){
        return (
            <div className="select-filter">
                {
                    this.props.label &&
                    <div className="select-filter-name">
                        { this.props.label }
                    </div>
                }
                <SelectInputField
                    placeholder={this.props.placeholder || "Select filter..."}
                    search
                    options={(
                            this.props.difference_mode ? this.props.filters.filter((v)=> !this.props.values.includes(v)  ) : this.props.filters
                        ).map((value:string, idx)=>{
                        return {
                            label: <Fragment key={idx}>
                                {
                                    this.props.difference_mode ? null
                                    :
                                        this.props.values?.includes(value) ?
                                            <i className="fas fa-check-square"/> 
                                        :
                                            <i className="far fa-square"/>
                                }
                                { " " + value }
                            </Fragment>,
                            value
                        }
                    }) || []}
                    onChange={(value:string)=>{
                        this.toggle_filter(value);
                    }}
                    value={null}
                />
                <div className="select-filter-values-values">
                    {
                        this.props.values.map((value:string, idx)=>(
                            <div
                                key={idx}
                                className="select-filter-values-value" 
                                onClick={()=>{
                                    this.toggle_filter(value);
                                }}
                            >
                                { value }
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }


    toggle_filter = async (value:string) =>{
        let { values } = this.props;
        let index = values?.indexOf(value);
        if(index !== -1){
            values.splice( index, 1 );
        }
        else{
            values.push(value);
        }
        this.forceUpdate();
        this.props.onChange?.(values);
    }

};