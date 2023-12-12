import classNames from 'classnames';
import React,{ Component } from 'react';
import './Tabs.css';

export interface Tab{
    label: React.ReactNode|string,
    content: React.ReactNode,
}
interface Props{
    tabs: Tab[]
    className?:string
    operations?: React.ReactNode
    onSelect?: (index: number)=>void
    tabContent?:{
        className?: string
    }
    tabBar?:{
        className?: string
    }
}


export default class Tabs extends Component<Props>{

    state={
        selected: 0
    }

    render(){
        if(this.state.selected >= this.props.tabs.length){
            this.setState({ selected: 0 });
        }
        return (
            <div className={`tabs ${this.props.className || ''}`}>
                <div className={`tab-bar ${this.props.tabBar?.className || ''}`}>
                    {
                        this.props.tabs.map((t, idx:number)=>(
                            <div
                                key={idx} 
                                className={classNames({"tab": true, "selected": this.state.selected === idx })}
                                onClick={()=>{
                                    this.setState({ selected:idx });
                                    this.props.onSelect?.(idx);
                                }}
                            >
                                {t.label}
                            </div>
                        ))
                    }
                    {
                        this.props.operations
                    }
                </div>
                <div className={`tab-content ${this.props.tabContent?.className || ''}`}>
                    { this.props.tabs[this.state.selected] && this.props.tabs[this.state.selected].content }
                </div>
            </div>
        )
    }
};
