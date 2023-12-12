import React, { Component, createRef, RefObject } from "react";
import "./PlotCSV.css";
import classNames from "classnames";
import { SelectInputField } from "../InputField/InputField";
import { FaCheckCircle } from "react-icons/fa";
import { TbAxisY, TbAxisX, TbSwitchHorizontal } from "react-icons/tb";
import Plotly from 'plotly.js-dist';
import { connect } from "react-redux";
import { ReduxAction, RootState } from "../../redux/store";
import { AppState, setApp } from "../../redux/reducers/app";

interface Props {
    folder?: string
    data: string[][]
    headers: string[]
    hideRows?: Array<number>

    // REDUX
    app: AppState,
    setApp: ReduxAction<AppState>
}
interface State {
    xPlotSelect?: number
    yPlotSelect?: number
    zPlotSelect?: number
    selectableHeaders?: number[]
    xPlot?: number
    yPlot?: number
    zPlot?: number
}


export default connect((state: RootState)=>{
    return {
        app: state.app
    }
},{
    setApp
})(class PlotCSV extends Component<Props, State>{
    ref: RefObject<any>
    constructor(props:Props){
        super(props);
        this.state = {
            ...this.configure()
        }
        this.ref = createRef<any>()
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if(
            prevProps.data !== this.props.data
            || prevProps.headers !== this.props.headers
            || prevProps.hideRows !== this.props.hideRows
        )
            this.setState(this.configure())
    }

    configure = () =>{
        let selectableHeaders = this.props.headers.map((_, idx)=>idx);
        if(this.props.hideRows)
            selectableHeaders = selectableHeaders.filter((idx)=> this.props.hideRows && !this.props.hideRows.includes(idx) )

        return {
            selectableHeaders,
            xPlotSelect: selectableHeaders[0],
            yPlotSelect: selectableHeaders[1],
            zPlotSelect: undefined
        }
        
    }

    generatePlot = () =>{
        Plotly.purge('csv-plot');
        if(this.state.xPlot !== undefined && this.state.yPlot !== undefined){
            try{
                let { xPlot, yPlot, zPlot } = this.state;
                let config:any = {
                    folder: this.props.folder,
                    x: this.props.data.map((d)=> d[xPlot] ),
                    y: this.props.data.map((d)=> d[yPlot] ),
                    mode: 'markers' ,
                    type: 'scatter',
                };
                if(zPlot !== undefined){
                    config.marker = {
                        color: this.props.data.map((d)=> zPlot ? d[zPlot] : undefined) ,
                        showscale: true,
                    };
                }
                
                Plotly.newPlot('csv-plot', [
                    config
                ])

                this.ref.current?.on('plotly_click', (data: any) => {
                    console.log("CLICKED", data)
                    // var pts = '';
                    // for(var i=0; i < data.points.length; i++){
                    //     pts = 'x = '+data.points[i].x +'\ny = '+
                    //         data.points[i].y.toPrecision(4) + '\n\n';
                    // }
                    // alert('Closest point clicked:\n\n'+pts);

                    if(data.points?.[0]){
                        console.log('point', data.points[0])
                        let { x, y } = data.points[0];
                        let { folder } = data.points[0].data;
                        // == instead of === for numbers that are strings
                        let dataIndex = this.props.data.findIndex((d)=> { return d[xPlot] == x && d[yPlot] == y } );
                        this.props.setApp({
                            plotSpectrum:{
                                folder,
                                index: dataIndex
                            }
                        })
                    }
                    

                });
            }
            catch(e){
                console.error(e);
            }
        }
    }
    

    render (){
        return (
            <div className="plot-csv">

                <div className="plot-configuration">
                    {
                        this.state.selectableHeaders &&
                        <>
                            <SelectInputField
                                label={<><TbAxisX/> X axis</>}
                                value={this.state.xPlotSelect}
                                options={this.state.selectableHeaders.map((h)=>{ return { value: h, label: this.props.headers[h]  } })}
                                onChange={(xPlotSelect)=>{ this.setState({ xPlotSelect }) }}
                            />
                            <div
                                className="custom-button shadowed rounded"
                                onClick={()=>{
                                    let { xPlotSelect, yPlotSelect } = this.state;
                                    this.setState({
                                        yPlotSelect: xPlotSelect,
                                        xPlotSelect: yPlotSelect
                                    })
                                }}
                            >
                                <TbSwitchHorizontal/>
                            </div>
                            <SelectInputField
                                label={<><TbAxisY/> Y axis</>}
                                value={this.state.yPlotSelect}
                                options={this.state.selectableHeaders.map((h)=>{ return { value: h, label: this.props.headers[h]  } })}
                                onChange={(yPlotSelect)=>{ this.setState({ yPlotSelect }) }}
                            />
                            <SelectInputField
                                label={<><TbAxisY/> Z axis</>}
                                nullable
                                placeholder={<div className="select-none">None</div>}
                                value={this.state.zPlotSelect}
                                options={this.state.selectableHeaders.map((h)=>{ return { value: h, label: this.props.headers[h]  } })}
                                onChange={(zPlotSelect)=>{ this.setState({ zPlotSelect }) }}
                            />
                        </>
                    }

                    <div 
                        className={classNames({
                            "custom-button rounded shadowed": true,
                            "disabled": (
                                this.state.xPlotSelect === this.state.yPlotSelect
                                || (
                                    this.state.xPlot === this.state.xPlotSelect
                                    && this.state.yPlot === this.state.yPlotSelect
                                    && this.state.zPlot === this.state.zPlotSelect
                                )
                            )
                        })}
                        onClick={async()=>{
                            await this.setState({
                                xPlot: this.state.xPlotSelect,
                                yPlot: this.state.yPlotSelect,
                                zPlot: this.state.zPlotSelect
                            })
                            this.generatePlot()
                        }}
                    >
                        <FaCheckCircle/> Plot
                    </div>

                </div>
                <div 
                    className="csv-plot-graph"
                    style={{
                        opacity: this.state.xPlot !== undefined && this.state.yPlot !== undefined ? 1 : 0 
                    }}
                >
                    <div ref={this.ref} id="csv-plot"/>
                </div>
            </div>
        )
    }

})