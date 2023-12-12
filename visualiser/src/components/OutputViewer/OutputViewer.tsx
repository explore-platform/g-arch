import React, { Component, ReactNode } from "react";
import "./OutputViewer.css";
import classNames from "classnames";
import { FaFileAlt, FaFolder, FaFolderOpen } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import { APP_URL, requestError } from "../../utils/global";
import { request } from "../../utils/request";
import CSVTable from "../CSVTable/CSVTable";
import { FilesState, setFiles } from "../../redux/reducers/files";
import { connect } from "react-redux";
import { ReduxAction, RootState } from "../../redux/store";
import Loading from "../Loading/Loading";
import { fetchFiles } from "../../utils/output";
import PlotCSV from "../PlotCSV/PlotCSV";
import { checkInputExists, checkOutputExists, getPlotOperation } from "../../utils/fits";
import { AppState, setApp } from "../../redux/reducers/app";
import { TbWaveSine } from "react-icons/tb";
import { AppFile, fetchProperties, getBaseDir } from "../../utils/files";
import FitsViewer from "../FitsViewer/FitsViewer";

interface Props {
    // REDUX
    files: FilesState
    app: AppState
    setFiles: ReduxAction<FilesState>
    setApp: ReduxAction<AppState>
}
interface State {
    loadingOutputFile: boolean
    selectedFile?: string

    openFolders: string[]

    // outputs
    fitsFile?: boolean
    csvData?: { folder?: string, headers: string[], data: string[][], hideRows?: number[], plotable?: boolean }
    textData?: string
    imageData?: any
    header?: (header: ReactNode, idx: number) => ReactNode
    operations?: (row: string[], idx: number) => ReactNode
}


class OutputViewer extends Component<Props, State>{
    constructor(props: Props) {
        super(props);
        this.state = {
            openFolders: [],
            loadingOutputFile: false
        }
    }
    render() {
        return (
            <div className="output-files">

                <div className="output-files-navigator">
                    {
                        this.props.files.files ?
                            this.props.files.files?.length > 0 ?
                                this.getFolderContent([...this.props.files.files], "")
                                : <div className="no-data">EMPTY</div>
                            : this.props.files.loading && <Loading message="Fetching files..." />
                    }
                </div>
                <div className="output-file">
                    {
                        this.state.selectedFile &&
                        <>
                            <div className="selectedFile"></div>
                            {this.getOutputFile()}
                        </>
                    }
                </div>
            </div>
        )
    }

    getFolderContent = (files: AppFile[], parentPath: string) => (
        <div className="folder-content">
            {
                files.length === 0 ?
                    <div className="no-data">EMPTY</div>
                    :
                    files.map((file, idx) => {
                        let { openFolders } = this.state;
                        let openfolderIndex = openFolders.indexOf(file.path);

                        if (file.children)
                            return (
                                <div
                                    key={idx}
                                    className={classNames({
                                        "folder": true,
                                    })}
                                >
                                    <div
                                        className="folder-name"
                                        onClick={() => {
                                            if (openfolderIndex !== -1)
                                                openFolders.splice(openfolderIndex, 1)
                                            else
                                                openFolders.push(file.path)
                                            this.setState({ openFolders })
                                        }}
                                    >
                                        { openfolderIndex !== -1 ? <FaFolderOpen /> : <FaFolder />} {file.name}
                                        <div
                                            className="file-operations"
                                        >
                                            {
                                                this.props.app.plotSpectrum?.folder === file.name &&
                                                <div
                                                    className="file-operation plot"
                                                >
                                                    <TbWaveSine />
                                                </div>
                                            }

                                            <div
                                                className="file-operation delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    this.deleteOutputFile(parentPath, file)
                                                }}
                                            >
                                                <IoTrashBin />
                                            </div>
                                        </div>
                                    </div>
                                    {
                                        openfolderIndex !== -1 &&
                                        this.getFolderContent(file.children, this.getFilePath(parentPath, file))
                                    }
                                </div>
                            )
                        else
                            return (

                                <div
                                    key={idx}
                                    className={classNames({
                                        "file": true,
                                        "selected": this.fileSelected(parentPath, file)
                                    })}
                                    onClick={() => { this.viewFile(parentPath, file) }}
                                >
                                    <FaFileAlt /> {file.name}
                                    <div
                                        className="file-operations"
                                    >
                                        <div
                                            className="file-operation delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                this.deleteOutputFile(parentPath, file)
                                            }}
                                        >
                                            <IoTrashBin />
                                        </div>
                                    </div>
                                </div>
                            )
                    })
            }
        </div>
    )

    getFilePath = (parentPath: string, file: AppFile) => {
        return `${parentPath}/${file.name}`
    }

    fileSelected = (parentPath: string, file: AppFile) => {
        return this.state.selectedFile && this.state.selectedFile === this.getFilePath(parentPath, file)
    }

    viewFile = async (parentPath: string, file: AppFile) => {
        this.setState({ loadingOutputFile: true, header: undefined, operations: undefined, fitsFile: false })
        try {
            let selectedFile = this.getFilePath(parentPath, file);
            this.setState({ csvData: undefined, textData: undefined, imageData: undefined, selectedFile })

            let baseDir = parentPath.split('/')[parentPath.startsWith('/') ? 1 : 0];

            if (selectedFile.endsWith('.fits')) {
                this.setState({ fitsFile: true })
            }
            else {
                let { data } = await request(`${APP_URL}/api/v1/output/${selectedFile}`);
                if (
                    selectedFile.endsWith('output.txt')
                    || selectedFile.endsWith('output_old.txt')
                    || selectedFile.endsWith('evolutions.txt')
                    || selectedFile.endsWith('.csv')
                ) {
                    data = data.replace(/( )+/g, ',').split('\n');

                    if (
                        selectedFile.endsWith('output.txt')
                        || selectedFile.endsWith('output_old.txt')
                    )
                        data.shift();


                    let headers: string;
                    if(
                        selectedFile.endsWith('normalized.csv')
                        || selectedFile.endsWith('solutionInput.csv')
                    ){
                        
                        // TEMP FIX
                        data.forEach((line: string, idx: number) => {
                            data[idx] = line.replace(/,$/, '');
                        })
                        
                        headers = data[0]?.split(',').map((_:any, idx:number)=>{
                            if(idx === 0) return "Wavelength"
                            else return `col${idx-1}`
                        }).join(',');

                        this.setState({
                            header: (header, idx) => {
                                return (
                                    <div className="table-header">
                                        <div className="table-operations">
                                            { getPlotOperation(baseDir, idx, undefined, 1) }
                                        </div>
                                        {
                                            header
                                        }
                                    </div>
                                )
                            }
                        })
                    }
                    else{
                        headers = data.shift();
                    }

                    data.shift();
                    if (selectedFile.endsWith('evolutions.txt')) {
                        data.shift();
                    }
                    data.forEach((line: string, idx: number) => {
                        data[idx] = line.replace(/^,/, '');
                    })

                    headers = headers.replace(/^#\s*/, '')

                    let textOutputHeaders: string[] = headers.split(',');
                    let hideRows: number[] = [];
                    data = data.filter((r: string) => !!r);
                    data.forEach((line: string, idx: number) => {
                        data[idx] = data[idx].split(',')
                    })

                    if (selectedFile.endsWith('evolutions.txt')) {
                        hideRows = [7]
                    }
                    else {
                        textOutputHeaders.forEach((h, idx) => {
                            if (h.includes('Error'))
                                hideRows.push(idx)
                            else if (
                                [
                                    "iter_flag_id=idresult",
                                    "interpStatus",
                                    "it"
                                ].includes(h)
                            )
                                hideRows.push(idx)
                        })
                    }

                    this.setState({
                        csvData: {
                            folder: getBaseDir(selectedFile),
                            data: data,
                            // data: data.join('\n'),
                            headers: textOutputHeaders,
                            hideRows: hideRows,
                            plotable: true
                        }
                    })
                }
                else {
                    this.setState({ textData: data })
                }
            }
            

            if (["output.txt"].includes(file.name)) {

                let input: undefined | { initspec: number, finalspec: number };
                if (file.name === "input.fits") {
                    let properties = await fetchProperties(baseDir);
                    input = {
                        initspec: parseInt(properties['gaia.matisse.initspec']) || 0,
                        finalspec: parseInt(properties['gaia.matisse.finalspec']) || 0
                    }
                }
                if (
                    checkOutputExists(baseDir)
                    && checkInputExists(baseDir)
                )
                    this.setState({
                        operations: (cols, idx) => {

                            return (
                                <div className="table-operations">
                                    {getPlotOperation(baseDir, idx, input)}
                                </div>
                            )
                        }
                    })
            }
        }
        catch (e) {
            requestError(e)
        }
        finally {
            this.setState({ loadingOutputFile: false })
        }
    }

    getOutputFile = () => {
        if (this.state.fitsFile && this.state.selectedFile) {
            return (
                <FitsViewer
                    file={this.state.selectedFile}
                />
            )
        }
        if (this.state.csvData) {
            return (
                <>
                    <CSVTable
                        data={this.state.csvData.data}
                        parse_options={{
                            // delimiter: " "

                        }}
                        headers={this.state.csvData.headers}
                        data_headers={this.state.csvData.headers}
                        hide_rows={this.state.csvData.hideRows}
                        header={this.state.header}
                        operations={this.state.operations}
                    />
                    {
                        this.state.csvData.plotable &&
                        <PlotCSV
                            {...this.state.csvData}
                        // folder={this.state.csvData}
                        // data={this.state.csvData.data}
                        // headers={this.state.csvData.headers}
                        // hide_rows={this.state.csvData.hideRows}

                        // plotableColumns={this.state.csvData.headers.map((_, idx)=>idx)(
                        //     this.state.csvData ? .filter((idx)=> !this.state.csvData.includes )} : .)
                        />
                    }
                </>
            )
        }
        if (this.state.loadingOutputFile) {
            return (
                <div className="no-data">Loading file...</div>
            )
        }
        if (this.state.textData) {
            return (
                <div className="text-data">
                    {this.state.textData}
                </div>
            )
        }
        return (
            <div className="no-data">NOT READABLE</div>
        )
    }

    deleteOutputFile = async (parentPath: string, file: AppFile) => {
        if (window.confirm(`Are you sure you want to remove ${file.name} ?`)) {
            try {
                await request(`${APP_URL}/api/v1/output/${this.getFilePath(parentPath, file)}`, {
                    method: 'delete'
                });
                fetchFiles();
            }
            catch (e) {
                requestError(e)
            }
            finally {
            }
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
})(OutputViewer)