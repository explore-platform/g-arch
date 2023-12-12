import React, { Component } from "react";
import "./StarSelect.css";
import classNames from "classnames";
import { connect } from "react-redux";
import { RootState } from "../../redux/store";
import { FiSearch } from "react-icons/fi";
import stars from './stars';
import { BsCheckLg } from "react-icons/bs";
import SearchBar from "../SearchBar/SearchBar";
import { AppState } from "../../redux/reducers/app";
import { FaArrowLeft, FaArrowRight, FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Value = Star[]
export type Star = { 
    id: string, 
    // name: string 
}
interface Props {
    value?: Value
    onChange: (value: Value)=>void

    // REDUX
    app: AppState
}
interface State {
    search: string,
    searchUpdate: string,
    filtered?: Star[]
    paginationCount: number
    pagination: number
    paginationUpdate: string
}


class StarSelect extends Component<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            search: '',
            searchUpdate: '',

            paginationCount: 100,
            pagination: 1,
            paginationUpdate: "1",
        }
    }


    setFiltered = () =>{
        let { search } = this.state;
        search = search.toLowerCase();
        let filtered = undefined;
        if(search)
            filtered = this.props.app.stars?.filter((s)=> s.id?.toLowerCase().includes(search) /* || s.name.toLowerCase().includes(search)*/  )
        this.setState({
            filtered,
            pagination: 1,
            paginationUpdate: "1",
        })
    }


    render (){
        let stars = (this.state.filtered || this.props.app.stars)
        let pages = stars?.length  ? Math.ceil(stars.length / this.state.paginationCount) : 0;
        return (
            <div className="star-select">
                <div className="star-select-search-container">

                    <div className="star-select-search">
                        <SearchBar
                            value={this.state.searchUpdate}
                            onChange={(searchUpdate)=>{ this.setState({ searchUpdate });}}
                        />
                        <div
                            className={classNames({ 
                                "custom-button rounded shadow": true,
                                "disabled": this.state.search === this.state.searchUpdate
                            })}
                            onClick={async()=>{
                                await this.setState({ search: this.state.searchUpdate }); this.setFiltered()
                            }}
                        >
                            Search
                        </div>
                    </div>
                    <div className="star-select-list-container">
                        <div className="star-select-list">
                            {
                                ( 
                                    this.state.filtered 
                                    || this.props.app.stars
                                    // || stars
                                )?.slice( 
                                    (this.state.pagination - 1 ) * this.state.paginationCount,  
                                    (this.state.pagination ) * this.state.paginationCount,
                                )?.map((s, idx)=>{
                                    // let selected = this.props.value?.includes(s.id);
                                    let starIndex = this.props.value?.indexOf(s);
                                    let selected = starIndex !== undefined && starIndex !== -1;
                                    return (
                                        <div 
                                            key={idx}
                                            className={classNames({
                                                "star-item checkbox-parent": true,
                                                selected
                                            })}
                                            onClick={()=>{
                                                let value = this.props.value || [];
                                                if(starIndex !== undefined && starIndex !== -1) value.splice(starIndex, 1);
                                                else value.push(s)
                                                this.props.onChange(value);
                                            }}
                                        >
                                            <div className="star-item-value checkbox-value">
                                                {
                                                    selected && <BsCheckLg />
                                                }
                                            </div>
                                            <div className="star-item-name">
                                                <div className="star-id">
                                                    { s.id }
                                                </div>
                                                {/* <div className="star-name">
                                                    { s.name }
                                                </div> */}
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="pagination">
                            <div 
                                className={classNames({ 
                                    "pagination-arrow left": true, 
                                    "disabled": this.state.pagination === 1
                                })}
                                onClick={()=>{
                                    if(this.state.pagination > 1){
                                        let update = this.state.pagination - 1;
                                        this.setState({ pagination: update, paginationUpdate: update.toString() })
                                    }
                                }}
                            >
                                <FaChevronLeft/>
                            </div>
                            <input
                                value={this.state.paginationUpdate}
                                onChange={(e)=>{ this.setState({ paginationUpdate: e.target.value }) }}
                                onKeyDown={(e)=>{
                                    if(e.key === 'enter'){
                                        let update = parseInt(this.state.paginationUpdate);
                                        if(update > pages) update = pages;
                                        if(update < 1) update = 1;
                                        this.setState({ pagination: update, paginationUpdate: update.toString() })
                                    }
                                }}
                            />
                            {
                                this.state.paginationUpdate !== '' &&
                                this.state.pagination !== parseInt(this.state.paginationUpdate) &&
                                <div className="apply-pagination"
                                    onClick={()=>{
                                        let update = parseInt(this.state.paginationUpdate);
                                        if(update > pages) update = pages;
                                        if(update < 1) update = 1;
                                        this.setState({ pagination: update, paginationUpdate: update.toString() })
                                    }}
                                >
                                    <FaCheck/>
                                </div>
                            }
                            <span>
                                of
                            </span>
                            <div className="pagination-pages">
                                { pages }
                            </div>
                            <div 
                                className={classNames({ 
                                    "pagination-arrow right": true, 
                                    "disabled": this.state.pagination === pages
                                })}
                                onClick={()=>{
                                    if(this.state.pagination < pages){
                                        let update = this.state.pagination + 1;
                                        this.setState({ pagination: update, paginationUpdate: update.toString() })
                                    }
                                }}
                            >
                                <FaChevronRight/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="star-select-values-container">
                    <div 
                        className={classNames({
                            "star-select-count": true,
                            "none": !this.props.value?.length
                        })}
                    >                       
                        Selected 
                        <span>{this.props.value?.length || 0}</span>
                    </div>

                    <div className="star-select-values">
                        {
                            this.props.value?.map((s, idx)=>{
                                return (
                                    <div 
                                        key={idx}
                                        className={classNames({
                                            "star-item": true,
                                        })}
                                        
                                        onClick={()=>{
                                            let { value } = this.props;
                                            if(value){
                                                value.splice(value.indexOf(s), 1);
                                                this.props.onChange(value);
                                            }
                                        }}
                                    >
                                        <div className="star-item-name">
                                            <div className="star-id">
                                                { s.id }
                                            </div>
                                            {/* <div className="star-name">
                                                { s.name }
                                            </div> */}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }

}

export default connect((state: RootState)=>{
    return {
        app: state.app
    }
},{
})(StarSelect)