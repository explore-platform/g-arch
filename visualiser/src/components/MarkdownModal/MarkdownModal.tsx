import React, { Component } from "react";
import "./MarkdownModal.css";
import ReactModal from 'react-modal';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import Loading from "../Loading/Loading";
import { requestError } from "../../utils/global";
import { fetchAppData } from "../../utils/files";
import { MdHelpOutline } from "react-icons/md";
import { FaTimes } from "react-icons/fa";

interface Props{
}
interface State{
    loading: boolean
    open: boolean
    content?: string
}

export default class MarkdownModal extends Component<Props, State>{
    constructor(props:Props){
        super(props);
        this.state={
            loading: true,
            open: false,
        }
    }

    fetchDocument = async() =>{
        try{
            this.setState({ loading: true });
            let content = await fetchAppData('help.md');
            this.setState({ 
                content
            })

        }
        catch(e){
            requestError(e);
        }
        finally{
            this.setState({ loading: false })
        }
    }

    componentDidMount(): void {
        this.fetchDocument()
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if(this.state.open && !prevState.open){
            document.body.style.overflow = 'hidden';
        }
        if(!this.state.open && prevState.open){
            document.body.style.overflow = 'auto';
        }
    }

    componentWillUnmount(): void {
        if(this.state.open){
            document.body.style.overflow = 'auto';
        }
    }

    render (){
        return (
            <>
                <div 
                    className="custom-button rounded shadow" 
                    onClick={()=>{ 
                        this.setState({ open: true });
                        this.fetchDocument()
                    }}
                >
                    <MdHelpOutline/> HELP
                </div>
                <ReactModal
                    isOpen={this.state.open}
                    onRequestClose={()=>{
                        this.setState({ open: false })
                    }}
                    appElement={document.getElementById('home-page') || undefined}
                >
                    <div className="modal-content">
                        <div 
                            className="close-modal"
                            onClick={()=>{ this.setState({ open: false }) }}
                        >
                            <FaTimes/>
                        </div>
                        {
                            this.state.loading ? 
                                <Loading/>
                            :
                            this.state.content ?
                                <ReactMarkdown>
                                    { this.state.content }
                                </ReactMarkdown>
                            : 
                            <div className="no-data">
                                Document not available
                            </div>
                        }
                    </div>
                </ReactModal>
            </>

            
        )
    }
}