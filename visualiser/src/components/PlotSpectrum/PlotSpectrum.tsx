
import { Component, createRef, ReactNode, RefObject } from "react";
import './PlotSpectrum.css';
import { connect } from "react-redux";
import { AppState, setApp } from "../../redux/reducers/app";
import { ReduxAction, RootState } from "../../redux/store";
import { fetchFit, fetchFitsInfo } from "../../utils/fits";
import Plotly from 'plotly.js-dist';
import { fetchCSV, fetchProperties, outputFileExists } from "../../utils/files";
import { FaFolderOpen } from "react-icons/fa";
import { MdOutlineChecklist } from 'react-icons/md'
import { FilesState } from "../../redux/reducers/files";
import { SelectInputField } from "../InputField/InputField";
import { getInputFilePath, getNormalizedFilePath, getNormalizedFilePath_old, getOutputFilePath } from "../../utils/output";
import { requestError } from "../../utils/global";
import classNames from "classnames";
import { TbWaveSine } from "react-icons/tb";

type Props = {

    // redux
    app: AppState
    files: FilesState
    setApp: ReduxAction<AppState>
}

type State = {
    loading: boolean

    plotableSpectrums?: number
    folderUpdate?: string,
    indexUpdate?: string

    loadingFolderInfo: boolean
}

type GenerateData = {
    inputX: any[] 
    inputY: any[]

    outputX: any[]
    outputY: any[]

    normalizedX?: any[]
    normalizedY?: any[]
}


export default connect((state: RootState)=>{
    return {
        app: state.app,
        files: state.files,
    }
},{
    setApp
})(
    class PlotSpectrum extends Component<Props,State>{
        ref: RefObject<HTMLDivElement>
        constructor(props:Props){
            super(props);
            this.state = {
                loading: false,
                loadingFolderInfo: false
            }
            this.ref=createRef();
        }

        componentDidMount(): void {
            this.generatePlot();
        }
        componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
            if(prevProps.app.plotSpectrum !== this.props.app.plotSpectrum){
                if(
                    this.props.app.plotSpectrum?.folder 
                    && this.state.folderUpdate !== this.props.app.plotSpectrum?.folder 
                )
                    this.fetchPlotableInfo(this.props.app.plotSpectrum.folder);
                this.generatePlot();
            }
        }

        getFitsPlotData = async({ 
            fitsInputPath,
            index,
            offset
        }: {
            fitsInputPath: string
            index: number // The column of data that interests us
            offset?: number // Some plots are offset by  a certain amount like input 
        }): Promise<{
            x: any[],
            y: any[]
        }> =>{
            let yFitsData = await fetchFit(fitsInputPath);
            let yFitsProperties = await fetchFit(fitsInputPath, 1);

            let y:any[] = yFitsData.split('\n');
            const _offset = offset || 0;
            y.shift()
            y.forEach((line: string, idx: number)=>{
                y[idx] = parseFloat(y[idx].split(',')?.[index + _offset])
            })
            let yProperties = yFitsProperties.split("\n");
            let yIncrement = parseFloat(yProperties[2]);
            let yBase = parseFloat(yProperties[1]) - yIncrement;

            let x = y.map(()=> yBase += yIncrement )


            return { x, y }
        }

        getCSVPlotData = async({ 
            CSVInputPath,
            index
        }: {
            CSVInputPath: string
            index: number // The column of data that interests us
        }): Promise<{
            x: any[],
            y: any[]
        }> =>{
            let yCSVData = await fetchCSV(CSVInputPath);

            let y:any[] = yCSVData.split('\n');
            let x:any[] = [];
            y.shift()
            y.forEach((line: string, idx: number)=>{
                let split = y[idx].split(',');
                x[idx] = parseFloat(split?.[0])
                // Offset by 1 because first column is x Axis
                y[idx] = parseFloat(split?.[index + 1])
            })

            return { x, y }
        }

        generateFitsPlotData = async(properties: any, folder:string, index:number) =>{
            let inputPlotData = await this.getFitsPlotData({
                fitsInputPath: getInputFilePath(folder),
                index,
                offset: parseInt(properties?.["gaia.matisse.initspec"]) || 0
            })


            let outputPlotData = await this.getFitsPlotData({
                fitsInputPath: getOutputFilePath(folder),
                index
            })

            /**
             * NORMALIZED DATA
             */
            let normalizedPlotData;
            let normalized1path = getNormalizedFilePath(folder);
            let normalized1Exists = outputFileExists(normalized1path);
            let normalized2path = getNormalizedFilePath_old(folder);
            let normalized2Exists = outputFileExists(normalized2path);
            if(
                normalized1Exists || normalized2Exists
            ){
                try{
                    normalizedPlotData = await this.getFitsPlotData({
                        fitsInputPath: normalized1Exists ? normalized1path : normalized2path,
                        index
                    })
                }
                catch(e){

                }
            }

            return {
                inputX: inputPlotData.x,
                inputY: inputPlotData.y,

                outputX: outputPlotData.x,
                outputY: outputPlotData.y,

                normalizedX: normalizedPlotData?.x,
                normalizedY: normalizedPlotData?.y
            }

        }


        generateCSVPlotData = async(properties: any, folder:string, index:number): Promise<GenerateData> =>{

            let inputPlotData = await this.getFitsPlotData({
                fitsInputPath: getInputFilePath(folder),
                index,
                offset: parseInt(properties?.["gaia.matisse.initspec"]) || 0
            })


            let outputPlotData = await this.getCSVPlotData({
                CSVInputPath: getOutputFilePath(folder, "csv"),
                index
            })

            /**
             * NORMALIZED DATA
             */
            let normalizedPlotData;
            let normalized1path = getNormalizedFilePath(folder, "csv");
            let normalized1Exists = outputFileExists(normalized1path);
            let normalized2path = getNormalizedFilePath_old(folder, "csv");
            let normalized2Exists = outputFileExists(normalized2path);
            if(
                normalized1Exists || normalized2Exists
            ){
                try{
                    normalizedPlotData = await this.getCSVPlotData({
                        CSVInputPath: normalized1Exists ? normalized1path : normalized2path,
                        index
                    })
                }
                catch(e){
                    console.error(e);
                }
            }
            else{
                console.log("No normalized file present")
            }

            return {
                inputX: inputPlotData.x,
                inputY: inputPlotData.y,

                outputX: outputPlotData.x,
                outputY: outputPlotData.y,

                normalizedX: normalizedPlotData?.x,
                normalizedY: normalizedPlotData?.y
            }
        }

        generatePlot = async() =>{
            this.setState({ loading: true });
            try{
                if(this.ref.current)
                    Plotly.purge('plot')
                let { plotSpectrum } = this.props.app;
                if(plotSpectrum){
                    this.setState({ folderUpdate: plotSpectrum.folder, indexUpdate: plotSpectrum.index.toString() });
                    let { folder, index } = plotSpectrum;

                    console.log("plot", plotSpectrum)
                    
                    let properties = await fetchProperties(folder);

                    const {
                        inputX,
                        inputY,
                        outputX,
                        outputY,
                        normalizedX,
                        normalizedY,
                    } = await (
                        (
                            properties?.["gaia.matisse.output_format_spectra"] 
                            && properties?.["gaia.matisse.output_format_spectra"] === "csv"
                        )
                        ? this.generateCSVPlotData(properties, folder, index)
                        : this.generateFitsPlotData(properties, folder, index)
                    )
                    // folder = "2023-03-23T17-01-37";

        
                    let config:any = {
                        // x: this.props.data.map((d)=> d[index] ),
                        // y: this.props.data.map((d)=> d[index] ),
                        mode: 'lines' ,
                        type: 'scatter',
                    };

                    
                    let plotConfig = [
                        {
                            x: inputX,
                            y: inputY,
                            name: "Input",
                            line:{
                                color:"rbg(0,255,0)"
                            },
                            ...config,
                        },
                        {
                            x: outputX,
                            y: outputY,
                            name: "Output",
                            line:{
                                color:"rbg(255,0,0)"
                            },
                            ...config
                        }
                    ]
                    if(normalizedX && normalizedY){
                        plotConfig.push({
                            x: normalizedX,
                            y: normalizedY,
                            name: "Normalized",
                            line:{
                                color:"rbg(0,0,255)"
                            },
                            ...config
                        })
                    }

                    Plotly.newPlot('plot', plotConfig)
                }
            }
            catch(e){
                
            }
            finally{
                this.setState({ loading: false })
            }
        }

        fetchPlotableInfo = async(folder:string, update?: boolean) =>{
            try{
                this.setState({ plotableSpectrums: undefined, loadingFolderInfo: true });
                if(update)
                    this.setState({ indexUpdate: undefined })

                let properties = await fetchProperties(folder);

                let updates: any = {};

                if(
                    properties?.["gaia.matisse.output_format_spectra"] 
                    && properties["gaia.matisse.output_format_spectra"] === "csv"
                ){
                    let info:any = await fetchCSV(getOutputFilePath(folder, "csv"))
                    info = info.split("\n");
                    info = (info[0]?.replace(/,$/)).split(',');
                    updates.plotableSpectrums = info.length - 1;
                }
                else{
                    let fitsinfo = await fetchFitsInfo({ path: getOutputFilePath(folder) })
                    updates.plotableSpectrums = fitsinfo[0]._axes[0];
                }

                this.setState(updates)
                if(update)
                    this.setState({ indexUpdate: "0" })
            }
            catch(e){
                requestError(e);
            }
            finally{
                this.setState({ loadingFolderInfo: false });
            }
        }
    
        render(): ReactNode {
            // if(!this.props.app.plotSpectrum) return null;
            return (
                <div className="blocks">
                    <div className="block">
                        <h2>Spectrum plot</h2>
                        <div className="plot-selected">
                            <SelectInputField
                                label={<><FaFolderOpen/> Plotted output</>}
                                options={(this.props.files.plotableFolders || []).map((f)=>{
                                    return {
                                        label: f,
                                        value: f
                                    }
                                })}
                                onChange={(folderUpdate)=>{ 
                                    this.fetchPlotableInfo(folderUpdate, true)
                                    this.setState({ folderUpdate }); 
                                }}
                                value={this.state.folderUpdate}
                            />
                            <SelectInputField
                                disabled={this.state.loadingFolderInfo}
                                messageType="info"
                                message={this.state.loadingFolderInfo ? "Fetching plottable spectrums..." : undefined}
                                label={<><MdOutlineChecklist/> Plotted spectrum</>}
                                options={(this.state.plotableSpectrums !== undefined ? 
                                    new Array(this.state.plotableSpectrums).fill(null) : [] )
                                    .map((_,idx)=>{
                                        return {
                                            label: idx,
                                            value: idx.toString()
                                        }
                                })}
                                onChange={(indexUpdate)=>{ this.setState({ indexUpdate });}}
                                value={this.state.indexUpdate}
                            />
                            <div
                                className={classNames({ 
                                    "custom-button rounded shadow": true,
                                    "disabled": (
                                        (
                                            this.state.folderUpdate === undefined
                                            || this.state.indexUpdate === undefined
                                        ) 
                                        || (
                                            this.props.app.plotSpectrum &&
                                            this.props.app.plotSpectrum.folder === this.state.folderUpdate &&
                                            this.props.app.plotSpectrum.index.toString() === this.state.indexUpdate
                                        )
                                        
                                    )
                                })}
                                onClick={()=>{
                                    if(
                                        this.state.folderUpdate !== undefined &&
                                        this.state.indexUpdate !== undefined
                                    )
                                    this.props.setApp({
                                        plotSpectrum:{
                                            folder: this.state.folderUpdate,
                                            index: parseInt(this.state.indexUpdate)
                                        }
                                    })
                                }}
                            >
                                <TbWaveSine/> PLOT
                            </div>


                            {/* <div className="plot-selected-info plot-folder">
                                <FaFolderOpen/> <label>{ this.props.app.plotSpectrum.folder }</label>
                            </div>
                            <div className="plot-selected-info plot-index">
                                <MdOutlineChecklist/> <label>{ this.props.app.plotSpectrum.index }</label>
                            </div> */}

                        </div>
                        {
                            this.state.loading &&
                            <>Loading plot...</>
                        }

                        <div ref={this.ref} id="plot"/>
                    </div>
                </div>
            )
        }
    }
)