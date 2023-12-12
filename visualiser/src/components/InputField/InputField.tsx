import React, { Component, createRef, HTMLProps, InputHTMLAttributes, ReactNode } from "react";
import classNames from "classnames";
import "./InputField.css";
import { FaChevronDown } from 'react-icons/fa';
import { BsCheckLg, BsQuestionCircleFill } from 'react-icons/bs';
import { FiFile } from "react-icons/fi";
import { nullUndefined } from "../../utils/global";
import { ImBin } from "react-icons/im";
import { Tooltip } from "react-tooltip";
import { renderToStaticMarkup } from 'react-dom/server';


type InputFieldProps = {
    id?: string
    className?: string
    label?: string | ReactNode

    disabled?: boolean
    message?: string
    messageType?: string


    help?: ReactNode

    // onChange: (value:any)=>any
}
type InputFieldState = {
}

class InputField<Props, State> extends Component<InputFieldProps & Props, InputFieldState & State>{
    className?: string;

    input = (): null | ReactNode => null;
    // input?: () => null|ReactNode;

    label= () => (<label>{this.props.label}</label>)

    render() {
        return (
            <div
                id={this.props.id}
                className={
                    classNames({
                        "input-field": true,
                        "disabled": this.props.disabled
                    })
                    + (this.props.className ? ` ${this.props.className}` : '')
                    + (this.className ? ` ${this.className}` : '')
                }
            >
                {this.label()}
                {this.input()}
                {
                    this.props.message ?
                        <div className={`input-field-message ${this.props.messageType || 'error'}`}>
                            { this.props.message }
                        </div>
                    : 
                        undefined
                }
                {
                    this.props.help &&
                    <>
                        <div 
                            className="help-tooltip"
                            data-tooltip-html={renderToStaticMarkup(<>{this.props.help}</>)}
                        >
                            <BsQuestionCircleFill/>
                        </div>
                        <Tooltip
                            className="help-tooltip-tooltip"
                            anchorSelect=".help-tooltip"
                            clickable
                        />
                    </>
                }
            </div>
        )
    }
}

type NumberInputFieldProps = {
    onChange: (value: string | null) => any
    value: string | number | undefined
    min?: number
    max?: number
}
type NumberInputFieldState = {
}

export class NumberInputField extends InputField<NumberInputFieldProps, NumberInputFieldState>{
    className = "number-input"

    input = () => (
        <input
            type="number"
            value={this.props.value}
            onChange={(e) => {
                this.props.onChange(e.target.value)
                // this.setState({ value: e.target.value })
            }}
            disabled={this.props.disabled}
            min={this.props.min}
            max={this.props.max}
        />
    )
}


type TextInputFieldProps = {
    onChange: (value: string) => any
    value: string | undefined
}
type TextInputFieldState = {
}

export class TextInputField extends InputField<TextInputFieldProps, TextInputFieldState>{
    className = "text-input"

    input = () => (
        <input
            type="text"
            value={this.props.value}
            onChange={(e) => {
                this.props.onChange(e.target.value)
                // this.setState({ value: e.target.value })
            }}
            disabled={this.props.disabled}
        />
    )
}


type BooleanInputFieldProps = {
    onChange: (value: boolean) => any
    value: boolean | undefined
}
type BooleanInputFieldState = {}

export class BooleanInputField extends InputField<BooleanInputFieldProps, BooleanInputFieldState>{
    className = "boolean-input"

    label= () => <></>

    input = () => (
        <div
            className={classNames({
                "input-checkbox": true,
                "checked": !!this.props.value,
            })}
            onClick={() => {
                this.props.onChange(!this.props.value);
            }}
        >
            <div className="input-checkbox-value">
                {
                    !!this.props.value && <BsCheckLg />
                }
            </div>
            <label>
                {this.props.label}
            </label>
        </div>
    )
}

type FileInputFieldProps = {
    // onChange: (file: any) => void
    // onDataChange?: (fileData: any) => void
    // value?: number
    // inputProps?: InputHTMLAttributes<any>



    value?: string|File;
    onChange?: (value: File|undefined) => void
    placeholder?: string

    tooltip?: ReactNode
    inputProps?: HTMLProps<HTMLInputElement>
}
type FileInputFieldState = {
    fileName?: string
    viewfile?: string
}

export class FileInputField extends InputField<FileInputFieldProps, FileInputFieldState>{
    className = "file-input"
    ref = createRef<HTMLInputElement>()


    componentDidUpdate(prevProps:(FileInputFieldProps & InputFieldProps)){
        if( this.props.value !== prevProps.value && this.props.value === undefined){
            if(this.ref.current)
                this.ref.current.value = '';
        }
    }

    getFileName = () =>{
        if(typeof this.props.value === 'string')
            return this.props.value
        else
            return this.props.value?.name
    }

    input = () => (
        <div 
            className="input-file" 
        >
            <div 
                className="input-file-value"
                // onClick={this.props.update ? ()=>{ this.ref.current?.click() } : undefined}
                onClick={()=>{ this.ref.current?.click() }}
            >
                <FiFile/>
                {
                    nullUndefined(this.props.value) ?
                        <div className="no-value">
                            Click to select file...
                            {
                                // this.props.update ?
                                //     "Click to select file..."
                                // :
                                //     "No file"
                            }
                        </div>
                    :
                        this.getFileName()
                }
            </div>
            <div className="input-operations">
                {
                    // this.props.update &&
                    <>
                        {
                            this.props.value && 
                            <div 
                                className="input-operation remove tt" 
                                onClick={()=>{
                                    if(window.confirm("Are you sure you want to remove selected file?")){
                                        this.props.onChange?.(undefined);
                                        if(this.ref.current)
                                            this.ref.current.value = '';
                                    }
                                }}
                            >
                                <ImBin/>
                            </div>
                        }
                    </>
                }
            </div>
            {
                // this.props.update &&
                <input
                    ref={this.ref}
                    placeholder={this.props.placeholder}
                    type="file"
                    onChange={(e)=>{ 
                        if (e.target.files) {
                            if(e.target.files[0] !== undefined){
                                this.props.onChange?.(e.target.files[0]);
                            }
                        }
                    }}
                    {...this.props.inputProps}
                />
            }
        </div>
        // <input
        //     type="file"
        //     onChange={(e) => {
        //         if (e.target.files) {
        //             const fileReader = new FileReader();

        //             fileReader.onload = () => {
        //                 this.props.onDataChange?.(fileReader.result);
        //             };
        //             this.props.onChange(e.target.files[0]);
        //             fileReader.readAsDataURL(e.target.files[0]);
        //         }
        //     }}
        //     disabled={this.props.disabled}
        //     {...this.props.inputProps}
        // />
    )
}


export type SelectInputFieldOption = { label: string | ReactNode, value: any };
export type SelectInputFieldOptions = SelectInputFieldOption[];

type SelectInputFieldProps = {
    options: SelectInputFieldOptions
    onChange: (value: any, group?: string) => any
    value: any | undefined

    group?: string

    search?: boolean
    nullable?: boolean

    placeholder?: string | ReactNode
    icon?: ReactNode
}
type SelectInputFieldState = {
    toggled: boolean
    search: string
}

export class SelectInputField extends InputField<SelectInputFieldProps, SelectInputFieldState>{
    constructor(props: SelectInputFieldProps) {
        super(props);
        this.state = {
            toggled: false,
            search: ''
        }
        this.ref = React.createRef();
        this.input_ref = React.createRef();
    }
    ref: any
    input_ref: any

    className = "select-input"

    toggle = (e: any) => {
        e.stopPropagation();
        this.setState({ toggled: !this.state.toggled });
    }
    close = () => {
        this.setState({ toggled: false });
    }
    handleClick = (e: any) => {
        if (this.ref.current.contains(e.target)) {
            return;
        }
        this.close();
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClick, false);
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClick, false);
    }

    selectedLabel = () => {
        let option = this.props.options.find((v: any) => v.value === this.props.value);
        return option ? option.label : undefined;
    }

    input = () => (
        <div
            className={
                classNames({
                    "select": true,
                    "toggled": this.state.toggled,
                    "disabled": this.props.disabled
                })
            }
            ref={this.ref}
        >
            <div
                className={classNames({ "select-value": true })}
                onClick={this.toggle}
            >
                {
                    this.props.value !== null && this.props.value !== undefined ?
                        this.selectedLabel()
                        :
                        this.props.placeholder ?
                            this.props.placeholder
                            :
                            "Select option..."
                }
            </div>
            <div
                className={classNames({ "select-icon": true })}
                onClick={this.toggle}
            >
                {
                    this.props.icon ?
                        this.props.icon
                        :
                        <FaChevronDown/>
                }
            </div>

            <div
                className={classNames({
                    "select-box": true,
                    "select-open": this.state.toggled
                })}
            >
                {
                    this.props.search &&
                    <div
                        className="select-search"
                        onClick={() => { this.input_ref.current?.focus() }}
                    >
                        <i className="fas fa-search" />
                        <input ref={this.input_ref} type="text" value={this.state.search} onChange={(e) => { this.setState({ search: e.target.value }) }} />
                    </div>
                }
                <div
                    className={classNames({
                        "select-options scrollbar": true
                    })}
                >
                    {
                        this.props.nullable &&
                        <div
                            onClick={(e) => { 
                                this.props.onChange(undefined); 
                                this.close() 
                            }}
                            className={classNames({
                                "select-option": true,
                                "option-selected": !this.props.value
                            })}
                        >
                            <i>-</i>
                        </div>
                    }
                    {
                        this.get_options(this.props.options)
                    }
                </div>
            </div>
        </div>
    )



    get_options = (options:any, group?:string) => {
        if(this.props.search && this.state.search){
            options = options.filter((option:any)=> 
                "group" in option 
                || option.label.toString()?.toLowerCase().includes?.(this.state.search.toLowerCase()) 
                || 
                // !this.props.no_value_search && 
                    (
                    typeof option.value === 'string' ? option.value?.toLowerCase()
                        : option.value?.toString?.()?.toLowerCase()
                    ).includes(this.state.search.toLowerCase()) 
            )
        }
        return (
            options.map((option:any, idx:number)=>(
                <div key={idx}>
                {
                    "group" in option ?
                        <div 
                            className={classNames({
                                "select-group":true
                            })}
                        >
                            <div className="select-group-name">
                                { option.group }
                            </div>
                            <div className="select-group-options">
                            {
                                this.get_options(option.options, option.group)
                            }
                            </div>
                        </div>
                    :
                        <div 
                            key={`${option.group} ${option.value.toString()}`}
                            onClick={(e)=>{this.props.onChange(option.value, group); this.close()}}
                            className={classNames({
                                "select-option":true,
                                "option-selected": option.value === this.props.value && this.props.group === group
                            })}>
                            {
                                option.label 
                            }
                        </div>
                }
                </div>
            ))
        )
    } 
}
