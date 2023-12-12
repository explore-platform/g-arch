import React, { Component, ReactNode } from "react";
import "./FitsViewer.css";
import { APP_URL, requestError } from "../../utils/global";
import { request } from "../../utils/request";
import CSVTable from "../CSVTable/CSVTable";
import { FilesState, setFiles } from "../../redux/reducers/files";
import { connect } from "react-redux";
import { ReduxAction, RootState } from "../../redux/store";
import { checkInputExists, checkOutputExists, fetchFit, FitsInfo, getPlotOperation } from "../../utils/fits";
import { AppState, setApp } from "../../redux/reducers/app";
import { fetchProperties, getBaseDir, getFileName, outputFileExists } from "../../utils/files";
import classNames from "classnames";

interface Props {
    file: string

    // REDUX
    files: FilesState
    app: AppState
    setApp: ReduxAction<AppState>
}
interface State {
    fitsInfo?: FitsInfo[]
    loading: boolean
    loadingFits: boolean
    fitsIndex: number

    // outputs
    csvData?: { headers: string[], data: string[][], hideRows?: number[] }
    header?: (header: ReactNode, idx: number) => ReactNode
    operations?: (row: string[], idx: number) => ReactNode
}


class FitsViewer extends Component<Props, State>{
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            loadingFits: false,
            fitsIndex: 0
        }
    }

    componentDidMount(): void {
        this.loadFits();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if(this.props.file !== prevProps.file){
            this.loadFits()
        }
    }

    render() {
        if(this.state.loading){
            return (
                <div className="no-data">Loading fits...</div>
            )
        }
        if(!this.state.fitsInfo){
            return(
                <div className="no-data">FITS NOT READABLE</div>
            )
        }
        return (
            <div className="fits-viewer">
                <div className="fits-select">
                    {
                        this.state.fitsInfo.map((info, index)=>(
                            <div 
                                className={classNames({ 
                                    "fits-select-tab": true, 
                                    "selected": this.state.fitsIndex === index 
                                })}
                                key={index}
                                onClick={async()=>{ 
                                    await this.setState({ fitsIndex: index });
                                    this.viewFile(index)
                                }}
                            >
                                { index }
                            </div>
                        ))
                    }
                </div>
                {
                    this.state.loadingFits ?
                        <div className="no-data">Loading table...</div>
                    :
                    this.state.csvData ?
                        <CSVTable
                            data={this.state.csvData.data}
                            headers={this.state.csvData.headers}
                            data_headers={this.state.csvData.headers}
                            hide_rows={this.state.csvData.hideRows}
                            header={this.state.header}
                            operations={this.state.operations}
                        />
                    :
                        <div className="no-data">TABLE NOT READABLE</div>
                }
            </div>
        )
    }

    getFilePath = (parentPath: string, file: any) => {
        return `${parentPath}/${file.name}`
    }

    loadFits = async () =>{
        this.setState({ loading: true, csvData: undefined, fitsInfo: undefined })
        try{
            let form = new FormData();
            form.append('path', this.props.file.replace(/^\//, ''));
            let { data } = await request(`${APP_URL}/science-api/fits_info`,{
                method: 'post',
                data: form
            });
            await this.setState({ fitsInfo: data, fitsIndex: 0 });            
            this.viewFile(0)

        }
        catch(e){
            requestError(e)
        }
        finally{
            this.setState({ loading: false })
        }

    }

    viewFile = async (index?: number) => {
        this.setState({ loadingFits: true, header: undefined, operations: undefined })
        try {
            this.setState({ csvData: undefined })
            let fitsIndex = index !== undefined ? index : this.state.fitsIndex;

            let raw = await fetchFit(this.props.file, fitsIndex)

            let data = raw.split('\n');
            let headers = data.shift().split(',');
            data.forEach((line: string, idx: number) => {
                data[idx] = data[idx].split(',')
            })

            let fileName = getFileName(this.props.file);
            if (
                [ "input.fits", "solutionInput.fits", "normalizedInput.fits", "normalized.fits" ].includes(fileName)
                && (
                    [ "normalizedInput.fits", "normalized.fits" ].includes(fileName) 
                    ? 
                        checkOutputExists(getBaseDir(this.props.file))
                        && checkInputExists(getBaseDir(this.props.file))
                    :
                    fileName === "input.fits" ? 
                        checkOutputExists(getBaseDir(this.props.file))
                    :   checkInputExists(getBaseDir(this.props.file))
                )
                &&  fitsIndex === 0
            ) {
                let baseDir = getBaseDir(this.props.file);
                let input: undefined|{initspec: number, finalspec:number};
                if(fileName === "input.fits"){
                    let properties = await fetchProperties(baseDir);
                    input={
                        initspec: parseInt(properties['gaia.matisse.initspec']) || 0,
                        finalspec: parseInt(properties['gaia.matisse.finalspec']) || 0
                    }
                }
                this.setState({
                    header: (header, idx) => {
                        return (
                            <div className="table-header">
                                <div className="table-operations">
                                    { getPlotOperation(baseDir, idx, input) }
                                </div>
                                {
                                    header
                                }
                            </div>
                        )
                    }
                })
            }

            this.setState({
                csvData: {
                    data: data,
                    headers
                }
            })
        }
        catch (e) {
            requestError(e)
        }
        finally {
            this.setState({ loadingFits: false })
        }
    }

}

export default connect((state: RootState) => {
    return {
        files: state.files,
        app: state.app
    }
}, {
    setFiles,
    setApp
})(FitsViewer)