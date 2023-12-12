import React, { Component } from "react";
import "./HomePage.css";
import Page from "../../components/Page/Page";
import { IoMdPlay } from 'react-icons/io'
import classNames from "classnames";
import Loading from "../../components/Loading/Loading";
import { request } from "../../utils/request";
import { socket } from "../../utils/websocket";
import { AiOutlineFileText, AiOutlineStop } from 'react-icons/ai'
import { BooleanInputField, FileInputField, NumberInputField, SelectInputField, TextInputField } from "../../components/InputField/InputField";
import { IoCog, IoTrashBin } from 'react-icons/io5';
import { GrTextAlignLeft } from 'react-icons/gr';
import { ImCogs } from 'react-icons/im'
import Tabs, { Tab } from "../../components/Tabs/Tabs";
import { APP_URL } from "../../utils/global";
import { FaFolderOpen } from "react-icons/fa";
import { fetchFiles } from "../../utils/output";
import OutputViewer from "../../components/OutputViewer/OutputViewer";

import logo_garch from '../../assets/logo_garch.png'
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import { AppState } from "../../redux/reducers/app";
import { BsCheckLg } from "react-icons/bs";
import { TbNorthStar } from "react-icons/tb";
import StarSelect, { Star } from "../../components/StarSelect/StarSelect";
import PlotSpectrum from "../../components/PlotSpectrum/PlotSpectrum";
import { fetchFitsInfo } from "../../utils/fits";
import MarkdownModal from "../../components/MarkdownModal/MarkdownModal";
import { checkStarList, isStarIDList } from "../../utils/stars";
import InfoHelper from "../../components/InfoHelper/InfoHelper";


type MatisseValues = {
    file?: any
    initspec?: string
    finalspec?: string


    is_dib?: boolean

    is_grid_elements_use?: boolean

    normalization?: boolean
    norm_method_name?: string
    norm_method_values?: [number, number]

    elements?: string[]

    mcmc_iterations?: number
    // If set to true it will be passed as a csv
    output_format_spectra: 'fits'|'csv'

    // byStarName?: boolean
}

type FileInformation = { spectrums: number };

interface Props {
    // redux
    app: AppState,
}
interface State {
    running: boolean
    scriptLogs: [string, string][]
    scriptStatus?: string
    exitCode?: number | null

    // options
    outputFolder: string
    options: MatisseValues

    loadingFileInformation: boolean
    fileInformation?: FileInformation


    fileCheck?: { valid: boolean, message?: string }
    byStarName:boolean


    file?: File
    fileData?: any
    fitsimg?: any

    inputList?: Star[]
    
}

let mounted = false;

export default connect((state: RootState) => { return { app: state.app } })(class HomePage extends Component<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            running: false,
            scriptLogs: [],

            loadingFileInformation: false,

            byStarName: false,

            outputFolder: this.getDefaultOutputFolder(),
            options: {
                initspec: "0",
                finalspec: "0",
                is_dib: true,
                is_grid_elements_use: true,
                elements: this.defaultElements(),
                normalization: true,
                // # guillaume, polynomial order, sigma clipping
                // # claire, polynomial order, number of iterations
                norm_method_name: 'claire',
                norm_method_values: [5, 5],
                output_format_spectra: "fits",
                // montecarlo iterations
                mcmc_iterations: 10
            }
        }
    }

    defaultElements = () =>{
        return [ ...(this.props.app.elements || []) ]
    }


    updateOptions = (attribute: keyof MatisseValues, value: any) => {
        let { options } = this.state;
        options[attribute] = value;
        this.setState({
            options
        })
    }

    componentDidMount(): void {
        if (!mounted) {

            socket.on('script_start', () => {
                console.log("SCRIPT STARTED");
                this.setState({
                    scriptStatus: "running"
                })

                this.scriptIsRunning();
                fetchFiles();
            });
            socket.on('script_message', (message) => {
                // console.log("SCRIPT MESSAGE", message);
                let { scriptLogs } = this.state;
                scriptLogs.unshift([
                    new Date()?.toISOString(),
                    message
                ])
                this.setState({ scriptLogs })
                this.scriptIsRunning();
            });
            socket.on('script_stop', (exitCode) => {
                console.log("SCRIPT STOPPED", exitCode);
                this.setState({ running: false, scriptStatus: "finished", exitCode })
                fetchFiles();
            });
            mounted = true;
        }
        fetchFiles();
    }

    getDefaultOutputFolder = () => {
        return new Date().toISOString().split(".")[0].replace(/:/g, '-')
    }

    scriptIsRunning = () => {
        if (!this.state.running) this.setState({ running: true, scriptStatus: "running", exitCode: undefined })
    }

    launch = async () => {
        this.setState({ running: true, scriptLogs: [], scriptStatus: "starting", exitCode: undefined })
        try {
            let options: { [key: string]: any } = {
                ...this.state.options
            };

            let { norm_method_name, norm_method_values } = options;
            options.norm_method = `${norm_method_name},${norm_method_values[0]},${norm_method_values[1]}`;
            delete options.norm_method_name;
            delete options.norm_method_values;


            var data = new FormData();

            Object.entries(options).forEach(([key, value]) => {
                if(key === "output_format_spectra")
                    if (value === "csv") return data.append("output_format_spectra", "csv");
                    else return;
                if(key === "elements" && value?.length === this.props.app.elements?.length) return;
                if(key === "initspec" && this.state.inputList?.length) 
                    return data.append(key, "0");
                if(key === "finalspec" && this.state.inputList?.length) 
                    return data.append(key, (this.state.inputList.length - 1).toString());

                data.append(key, value);
            })

            if(this.state.file){
                data.append('input', this.state.file );
                if(this.state.byStarName){
                    data.append('byStarName', "true")
                }
            }
            if(this.state.inputList?.length){
                data.append('inputList', JSON.stringify(this.state.inputList.map((s)=> s.id )));
            }
            
                
            data.append('outputFolder', this.state.outputFolder);

            let res = await request(`${APP_URL}/api/v1/matissev4`, {
                method: 'post',
                data
            });
            this.setState({
                outputFolder: this.getDefaultOutputFolder()
            })
            this.scriptIsRunning()
        }
        catch (e: any) {
            console.log("launch error", e );
            if (e?.response?.status === 409) {
                this.scriptIsRunning()
            }
            else {
                this.setState({ running: false });
            }
        }
    }

    stopProcess = async () => {
        try {
            await request(`${APP_URL}/api/v1/matissev4`, { method: 'delete' });
        }
        catch (e: any) {
        }
    }

    getExitCode = () => {
        if (!this.state.exitCode) return '';
        switch (this.state.exitCode) {
            case 0: return 'SUCCESS';
            case 1: return 'ERROR';
            case 137: return 'SIGKILL';
            default: return '';
        }
    }

    optional = (
        <><em>Optional</em></>
    )
    required = (
        <><em>*Required</em></>
    )

    checkInitSpectrum = (): { valid: boolean, message?:string } =>{
        let { finalspec, initspec } = this.state.options;
        if((initspec === '' || initspec === undefined)) return { valid: false, message: "Missing value" };
        let initspecValue = parseInt(initspec);
        if(initspecValue < 0) return { valid: false, message: `Must be greater or equal to 0` };
        if(this.state.fileInformation){
            if(initspecValue > this.state.fileInformation.spectrums - 1) 
                return { valid: false, message: `File only has ${this.state.fileInformation.spectrums} spectrums possible` };
        }
        if(finalspec !== '' && finalspec !== undefined){
            if(initspecValue > parseInt(finalspec)) return { valid: false, message: "Must be less or equal to final spectrum" };
        }
        return { valid: true }
    }

    checkFinalSpectrum = (): { valid: boolean, message?:string } =>{
        let { finalspec, initspec } = this.state.options;
        if((finalspec === '' || finalspec === undefined)) return { valid: false, message: "Missing value" };
        let finalspecValue = parseInt(finalspec);
        if(finalspecValue < 0) return { valid: false, message: `Must be greater or equal to 0` };
        if(this.state.fileInformation){
            if(finalspecValue > this.state.fileInformation.spectrums - 1) 
                return { valid: false, message: `File only has ${this.state.fileInformation.spectrums} spectrums possible` };
        }
        if(initspec !== '' && initspec !== undefined){
            if(finalspecValue < parseInt(initspec)) return { valid: false, message: "Must be greater or equal to initial spectrum" };
        }
        return { valid: true }
    }

    spectrumSelect = () => {
        let validInitSpectrum = this.checkInitSpectrum();
        let validFinalSpectrum = this.checkFinalSpectrum();
        return (
            <>
                <NumberInputField
                    disabled={this.state.loadingFileInformation || !this.state.file}
                    message={validInitSpectrum.message}
                    label={<>{this.required} Initial Spectrum</>}
                    onChange={(value) => { 
                        this.updateOptions('initspec', value)
                    }}
                    value={this.state.options.initspec}
                    min={0}
                    max={this.state.fileInformation?.spectrums ? this.state.fileInformation.spectrums - 1 : undefined}
                    help={<>Initial spectrum from file</>}
                />
                <NumberInputField
                    disabled={this.state.loadingFileInformation || !this.state.file}
                    message={validFinalSpectrum.message}
                    label={<>{this.required} Final Spectrum</>}
                    onChange={(value) => {
                        this.updateOptions('finalspec', value)
                    }}
                    value={this.state.options.finalspec}
                    min={0}
                    max={this.state.fileInformation?.spectrums ? this.state.fileInformation.spectrums - 1 : undefined}
                    help={<>Final spectrum from file</>}
                />
            </>
        )
    }

    checkCSV = (csv:string[]) =>{
        this.setState({ fileCheck: { valid: true } })
        if(isStarIDList(csv)){
            if(!checkStarList(csv)){
                this.setState({
                    fileCheck:{
                        valid: false,
                        message: "Invalid CSV, one of the elements does not match a star ID"
                    }
                })
            }
        }
    }

    render() {
        /** ===========================================
         *  TABS
            ===========================================*/

        let validInitSpectrum = this.checkInitSpectrum();
        let validFinalSpectrum = this.checkFinalSpectrum();

        const tabs: Tab[] = [
            {
                label: <><IoCog /> Parameters</>,
                content: <>
                    <div className="setting-row">

                        <div className="setting-section">
                            <h3>
                                DIB Computation 
                                <InfoHelper>
                                    Gaussian fit of the Diffuse Interstellar Band feature around 862 nm. It produces its equivalent width (EW), 
                                    the central wavelength of the fitted Gaussian ( p1 ), its depth ( p0 ), the width of the Gaussian profile ( p2 )
                                </InfoHelper>
                            </h3>
                            {/* Analyze DIB feature */}
                            <BooleanInputField
                                label={<>Analyze DIB feature</>}
                                onChange={(value) => { this.updateOptions('is_dib', value) }}
                                value={this.state.options.is_dib}
                            />
                        </div>


                        <div className="setting-section">
                            <h3>Output options</h3>
                            <SelectInputField
                                label={<>Output file type</>}
                                options={[
                                    { label: <>FITS</>, value: "fits" },
                                    { label: <>CSV</>, value: "csv" },
                                ]}
                                onChange={(value) => { this.updateOptions('output_format_spectra', value) }}
                                value={this.state.options.output_format_spectra}
                            />
                        </div>
                    </div>
                    <div className="setting-row">
                        <div className="setting-section">

                            <h3>
                                Elements
                                <InfoHelper>
                                    Gaussian fit of the Diffuse Interstellar Band feature around 862 nm. It produces its equivalent width (EW), 
                                    the central wavelength of the fitted Gaussian ( p1 ), its depth ( p0 ), the width of the Gaussian profile ( p2 )
                                </InfoHelper>
                            </h3>
                            {/* Analyze DIB feature */}
                            <BooleanInputField
                                label={<>Estimate individual chemical abundances</>}
                                onChange={(value) => { 
                                    this.updateOptions('is_grid_elements_use', value)
                                    if(value) this.updateOptions('elements', this.defaultElements());
                                    else this.updateOptions('elements', undefined);
                                }}
                                value={this.state.options.is_grid_elements_use}
                            />
                            {
                                this.state.options.is_grid_elements_use &&
                                <div className="element-selection">

                                    <BooleanInputField
                                        label={<>All elements</>}
                                        onChange={(value) => {
                                            if (value) {
                                                this.updateOptions('elements', [ ...(this.props.app.elements || []) ])
                                            }
                                            else {
                                                this.updateOptions('elements', [] )
                                            }
                                        }}
                                        value={this.state.options.elements?.length === this.props.app.elements?.length}
                                    />
                                    <div className="elements-list">
                                        {
                                            this.props.app.elements?.map((el, idx) => {
                                                let toggled = this.state.options.elements?.includes(el);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={classNames({
                                                            "element": true,
                                                            "toggled": toggled
                                                        })}
                                                        onClick={() => {
                                                            let { elements } = this.state.options;
                                                            if(elements){
                                                                if(toggled) elements.splice(elements.indexOf(el), 1);
                                                                else elements.push(el);
                                                            }
                                                            else{
                                                                elements = [ el ]
                                                            }
                                                            this.updateOptions('elements', elements)
                                                        }}
                                                    >

                                                        <div className="element-checkbox">
                                                            {
                                                                toggled && <BsCheckLg />
                                                            }
                                                        </div>
                                                        <div className="element-name">
                                                            { el }
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </>
            },
            {
                label: <><ImCogs /> Advanced parameters</>,
                content: <>
                    <div className="setting-row">

                        <div className="setting-section">

                            <h3>
                                Monte Carlo uncertainties
                                <InfoHelper>
                                    To estimate parameter uncertainties induced by the spectral noise, the complete MatisseGauguin 
                                    workflow is rerun a given number times to analyse the same number of 
                                    different Monte-Carlo realisations of the stellar spectrum. Upon each realisation, 
                                    the input stellar flux per pixel Fi is modified according to the corresponding 
                                    flux uncertainty of that pixel. Here you can chose the number of Monte-Carlo realizations.
                                </InfoHelper>
                            </h3>
                            {/* Analyze DIB feature */}
                            <NumberInputField
                                label={<>Uncertainty iterations</>}
                                onChange={(value) => { this.updateOptions('mcmc_iterations', value) }}
                                value={this.state.options.mcmc_iterations}
                            />

                        </div>

                    </div>
                    <div className="setting-row">

                        <div className="setting-section">
                            <h3>
                                Spectra Normalization
                                <InfoHelper>
                                    The spectrum flux is normalised over the entire wavelength domain. For this purpose, 
                                    the observed spectrum (O) is compared to an interpolated synthetic one from the 4D 
                                    reference grid (S) with the same atmospheric parameters. First, the most appropriate 
                                    wavelength points of the residuals (Res = S/O) are selected using an iterative procedure 
                                    implementing a linear fit to Res followed by a σ-clipping. The residual trend is then 
                                    fitted with a polynomial. You can choose here polynomial degree and the number of 
                                    iterations between the parametrization and the normalization steps. Also, two slightly 
                                    different continuum placement procedures (AMBREprojet1 from Santos-Peral et al. 2020 
                                    and AMBREprojet2 from Guiglion et al. 2016) are proposed.
                                </InfoHelper>
                            </h3>
                            {/* Analyze DIB feature */}
                            <BooleanInputField
                                label={<>Enable spectra normalization</>}
                                onChange={(value) => { this.updateOptions('normalization', value) }}
                                value={this.state.options.normalization}
                            />

                            <div className="input-row">
                                <SelectInputField
                                    disabled={!this.state.options.normalization}
                                    options={[
                                        { label: <>AMBREproject1</>, value: "claire" },
                                        { label: <>AMBREproject2</>, value: "guillaume" },
                                    ]}

                                    label={<>
                                        Normalization method

                                        <InfoHelper>
                                            <p>
                                                Normalisation methods are described in 
                                                <a 
                                                    href="https://ui.adsabs.harvard.edu/abs/2020A%26A...639A.140S%2F/abstract" 
                                                    target="_blank"
                                                >
                                                    Santos-Peral et al.
                                                </a>
                                                2020 (AMBREproject1) and 
                                                
                                                <a 
                                                    href="https://ui.adsabs.harvard.edu/abs/2016A%26A...595A..18G/abstract" 
                                                    target="_blank"
                                                >
                                                    Guiglion
                                                </a>
                                                et al. 2016, (AMBREproject2)
                                            </p>
                                        </InfoHelper>
                                    </>}
                                    onChange={(value) => { this.updateOptions('norm_method_name', value) }}
                                    value={this.state.options.norm_method_name}
                                />

                                <NumberInputField
                                    disabled={!this.state.options.normalization}
                                    label={<>Polynomial order</>}
                                    onChange={(value) => {
                                        this.updateOptions('norm_method_values', [value, this.state.options.norm_method_values?.[1]])
                                    }}
                                    value={this.state.options.norm_method_values?.[0]}
                                />
                                <NumberInputField
                                    disabled={!this.state.options.normalization}
                                    label={
                                        this.state.options.norm_method_name === 'guillaume' ?
                                            <>Sigma clipping</>
                                            : <>Number of iterations</>
                                    }
                                    onChange={(value) => {
                                        this.updateOptions('norm_method_values', [this.state.options.norm_method_values?.[0], value])
                                    }}
                                    value={this.state.options.norm_method_values?.[1]}
                                />

                            </div>

                        </div>
                    </div>
                </>
            }
        ];

        if (
            this.state.scriptStatus
            || this.state.scriptLogs.length > 0
        )
            tabs.push({
                label: <><GrTextAlignLeft /> Logs</>,
                content:
                    <>
                        <div className="script-logs">
                            {
                                this.state.scriptLogs?.map(([date, message], idx) => (
                                    <div key={idx} className="script-log">
                                        <div className="script-log-line">
                                            {this.state.scriptLogs.length - idx}
                                        </div>
                                        <div className="script-log-date">
                                            {date}
                                        </div>
                                        <div className="script-log-message">
                                            {message}
                                        </div>
                                    </div>
                                ))
                            }
                            {/* {this.state.scriptLogs} */}
                        </div>
                    </>
            });



        return (
            <Page id="home-page">
                <img src={logo_garch} className="app-logo" />
                <div className="help-container">
                    <MarkdownModal/>
                </div>
                <div className="section">
                    <div className="blocks">
                        <div className="block">
                            {/* <h1>Launch Matisse v4 Algorithm</h1> */}
                            <Tabs
                                className="script-input"
                                onSelect={()=>{
                                    this.setState({ file: undefined, fileInformation: undefined,byStarName: false });
                                    // this.updateOptions('byStarName', false);
                                    this.setState({ inputList: undefined })
                                }}                       
                                tabs={[
                                    {
                                        label: <><TbNorthStar /> Star select</>,
                                        content:<>
                                            <StarSelect
                                                value={this.state.inputList}
                                                onChange={(inputList)=>{ this.setState({ inputList }) }}
                                            />
                                        </>
                                    },
                                    {
                                        label: <><AiOutlineFileText /> Stars file (.csv)</>,
                                        content:<>
                                            {/* <BooleanInputField
                                                label={<>List of Target IDs</>}
                                                onChange={(value) => { this.updateOptions('byStarName', !value) }}
                                                value={!this.state.options.byStarName}
                                            /> */}
                                            <div className="input-file-fields">
                                                <FileInputField
                                                    message={this.state.fileCheck?.message}
                                                    label={<><AiOutlineFileText /> Stars file (.csv)</>}
                                                    onChange={(file) => {
                                                        this.setState({ file, fileInformation: undefined });
                                                        this.updateOptions('initspec', 0);
                                                        this.updateOptions('finalspec', 0);
                                                        if(file){
                                                            this.setState({ loadingFileInformation: true })
                                                            new Promise((resolve, reject)=>{
                                                                const fileReader = new FileReader();
                                                                fileReader.onload = () => {
                                                                    try{
                                                                        let fileText = (fileReader.result as string)?.split('\n');
                                                                        if((fileReader.result as string)?.endsWith('\n'))
                                                                            fileText.pop()
                                                                        if(fileText?.length){
                                                                            this.checkCSV(fileText)

                                                                            this.updateOptions('finalspec', fileText.length - 1);
                                                                            resolve(
                                                                                this.setState({
                                                                                    byStarName: !isStarIDList(fileText),
                                                                                    fileInformation: {
                                                                                        spectrums: fileText.length
                                                                                    }
                                                                                })
                                                                            )
                                                                        }
                                                                    }
                                                                    catch(e){
                                                                        reject(e)
                                                                    }
                                                                };
                                                                fileReader.readAsText(file);
                                                            })
                                                            .catch((e)=>{
                                                                console.error(e)
                                                            }).finally(()=>{
                                                                this.setState({ loadingFileInformation: false })
                                                            })
                                                        
                                                        }
                                                        
                                                    }}
                                                    value={this.state.file}
                                                    inputProps={{
                                                        accept: ".csv"
                                                    }}
                                                />
                                                { this.spectrumSelect() }
                                            </div>
                                        </>
                                    },
                                    {
                                        label: <><AiOutlineFileText /> Spectrum file (.fits)</>,
                                        content:<>
                                            <div className="input-file-fields">
                                                <FileInputField
                                                    message={this.state.fileCheck?.message}
                                                    label= {<><AiOutlineFileText /> Spectrum file (.fits)</>}
                                                    onChange={(file) => {
                                                        this.setState({ file, fileInformation: undefined, loadingFileInformation: true });
                                                        this.updateOptions('initspec', 0);
                                                        this.updateOptions('finalspec', 0);
                                                        if(file)
                                                            fetchFitsInfo({ file })
                                                            .then((data)=>{
                                                                this.updateOptions('finalspec', data[0]._axes[0] - 1);
                                                                this.setState({
                                                                    fileInformation:{
                                                                        spectrums: data[0]._axes[0]
                                                                    },
                                                                    fileCheck:{ valid: true }
                                                                })
                                                            })
                                                            .catch((e)=>{
                                                                this.setState({
                                                                    fileCheck:{ valid: false, message: "Invalid fits file" }
                                                                })
                                                                console.error(e);
                                                            })
                                                            .finally(()=>{
                                                                this.setState({ loadingFileInformation: false })
                                                            })
                                                    }}
                                                    value={this.state.file}
                                                    inputProps={{
                                                        accept: ".fits"
                                                    }}
                                                />
                                                { this.spectrumSelect() }
                                            </div>
                                        </>
                                    }
                                ]}
                            />

                            <TextInputField
                                label={<><FaFolderOpen /> Output folder</>}
                                value={this.state.outputFolder}
                                onChange={(outputFolder) => { this.setState({ outputFolder }) }}
                            />

                            <div className="operations-bar">
                                <div className="operation-buttons">
                                    <button
                                        className={classNames({
                                            "custom-button rounded shadow": true,
                                            "disabled": this.state.running 
                                                || !(
                                                    ( this.state.file 
                                                        && validInitSpectrum.valid 
                                                        && validFinalSpectrum.valid 
                                                        && this.state.fileCheck?.valid
                                                    )
                                                    || this.state.inputList?.length 
                                                ) 
                                                || !this.state.outputFolder
                                                || (this.state.options.is_grid_elements_use && !this.state.options.elements?.length)
                                        })}
                                        onClick={this.launch}
                                    >
                                        {
                                            this.state.running ?
                                                <>
                                                    <Loading message="RUNNING..." />
                                                </>
                                                :
                                                <>
                                                    <IoMdPlay />
                                                    <label>RUN</label>
                                                </>
                                        }
                                    </button>
                                    {
                                        this.state.running &&
                                        <>
                                            <br />
                                            <button
                                                className={classNames({
                                                    "custom-button red rounded shadow": true
                                                })}
                                                onClick={this.stopProcess}
                                            >
                                                <AiOutlineStop />
                                                <label>STOP</label>
                                            </button>
                                        </>
                                    }
                                </div>
                                {
                                    this.state.scriptStatus &&
                                    <div className="script-status">
                                        <label>Status</label>
                                        <div
                                            className={`script-status-tag ${this.state.scriptStatus || ''} ${this.getExitCode()}`}
                                        >
                                            {this.state.scriptStatus}
                                            {
                                                this.state.exitCode ?
                                                    ` (Exit code : ${this.state.exitCode})`
                                                    : null
                                            }
                                        </div>
                                    </div>
                                }

                            </div>
                            <Tabs
                                tabs={tabs}
                            />
                        </div>

                    </div>
                    {
                        <div className="blocks">
                            <div className="block">
                                <h2>Output Folder</h2>
                                <OutputViewer />
                            </div>
                        </div>
                    }

                    <PlotSpectrum/>
                </div>
            </Page>
        )
    }
})