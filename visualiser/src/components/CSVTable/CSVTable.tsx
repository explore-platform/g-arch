import React, { Component, ReactNode } from 'react';

import './CSVTable.css';
import * as csvParse from 'csv-parse';
import { parse } from 'csv-parse/sync';

import classNames from 'classnames';
import { APP_URL, nullUndefined, requestError } from '../../utils/global';
import LoadingIcon from '../LoadingIcon/LoadingIcon';
import { request } from '../../utils/request';
import SelectFilter from '../SelectFilter/SelectFilter';
import TableSearchInput from '../TableSearchInput/TableSearchInput';
import { SelectInputField } from '../InputField/InputField';

export type CSVTableFilter = {
    label?: string | React.ReactNode
    index: number
    null_value?: string
}
export type CSVSort = {
    filter: 'alphabetical' | 'numerical' | 'date'
} | {
    filter_asc: ((a: any, b: any) => any)
    filter_desc: ((a: any, b: any) => any)
}

interface Props {
    /** The data that will be shown */
    data: string | Array<Array<string>>

    /** List of headers */
    headers?: Array<string | React.ReactNode>
    data_headers: string[]

    /** Which columns to hide */
    hide_rows?: Array<number>

    /** Filter params to filter data */
    filters?: Array<CSVTableFilter>
    update_filter?: boolean // If the filter values should update on filter update

    /** Column sorting functionality */
    sort_columns?: {
        [key: number]: CSVSort
    }

    /** CSV parsing options */
    parse_options?: csvParse.Options

    /** Allow the export functionality */
    export?: boolean,
    /** The export file name */
    export_name?: string

    /** React dom element to append at the spart of each row */
    operations?: (row: string[], idx: number) => ReactNode

    header?: ( header: ReactNode, idx: number)=> ReactNode
}

interface State {
    headers?: Array<string | React.ReactNode>
    data_headers?: Array<string>

    search: string
    search_focused: boolean

    rows: number
    page: number
    page_select: number

    data?: any
    filtered?: any // filtered data is stored in the state to prevent recalculation when paginating
    sorted?: any // sorted data from filtered to prevent recalculating on each action

    filter_values: {
        [key: string]: Array<string>
    }
    selected_filters: {
        [key: string]: Array<string>
    }

    sort?: {
        column: number,
        direction: 'asc' | 'desc'
    }


    exporting?: string
}

export default class CSVTable extends Component<Props, State>{
    constructor(props: Props) {
        super(props);
        this.state = {
            search_focused: false,

            rows: 10,
            page: 1,
            page_select: 1,

            search: '',

            filter_values: {},
            selected_filters: {},

            // exporting: 'json'
            // exporting: false,
        }
    }

    componentDidMount() {
        this.configure_data()
    }
    componentDidUpdate(prevProps: Props) {
        if (this.props.data !== prevProps.data)
            this.configure_data()
    }


    configure_data = async () => {
        try {
            let data = typeof this.props.data === 'string' ?
                parse(this.props.data, {
                    from: 1,
                    ...this.props.parse_options
                })
                :
                this.props.data;

            // console.log("data", data);
            let headers = this.props.headers;
            let data_headers = this.props.data_headers;
            //  data.shift();


            this.configure_filter_values(data, { reset: true });

            this.setState({
                page: 1,
                page_select: 1,
                data,
                filtered: data,
                headers,
                data_headers
            });
        }
        catch (e) {
            // axiosErrorHandler(e, { functionName: `configure_data` });
            // toast_request_error(e);
            requestError(e);
        }
    }

    configure_filter_values = (data?: any, options?: {
        reset?: boolean,
        filter?: any
    }) => {
        if (!data) data = this.state.filtered;
        let filter_values: any = this.state.filter_values || {};
        let selected_filters: any = options?.reset ? {} : this.state.selected_filters;
        if (this.props.filters) {

            for (let filter of this.props.filters) {
                // console.debug("FILTERING FROM", options?.filter)
                if (
                    !(filter.index in filter_values)
                    || (
                        options?.filter !== undefined &&
                        options.filter?.index < filter.index
                    )
                )
                    filter_values[filter.index] = [];

                if (options?.reset) selected_filters[filter.index] = [];
            }
            for (let row of data) {
                for (let filter of this.props.filters) {

                    // if(!filter_values[filter.index].includes(row[filter.index]))  filter_values[filter.index].push(row[filter.index]);


                    let filter_key_value = filter.null_value && nullUndefined(row[filter.index]) ? filter.null_value : row[filter.index]
                    if (nullUndefined(row[filter.index]) && !filter.null_value) continue;
                    if (!filter_values[filter.index].includes(filter_key_value))
                        filter_values[filter.index].push(filter_key_value);
                }
            }

            for (let filter of this.props.filters) {
                filter_values[filter.index].sort((a: string, b: string) => a.localeCompare(b));
            }
        }

        this.setState({
            filter_values,
            selected_filters
        });
    }

    filter_data = async (filter?: any) => {
        if (!this.state.data) return null;

        let filtered = this.state.data.filter((row: Array<string>) =>
            (this.props.filters ?
                this.props.filters?.every((filter) =>
                    this.state.selected_filters?.[filter.index]?.length > 0 ?
                        this.state.selected_filters[filter.index].includes(row[filter.index])
                        || (
                            filter.null_value
                            && this.state.selected_filters[filter.index].includes(filter.null_value)
                            && nullUndefined(row[filter.index])
                        )
                        : true
                )
                : true)
            && (this.state.search ?
                row.some((value: string) => value.toLowerCase().includes(this.state.search.toLowerCase()))
                : true)
        );

        if (this.props.update_filter) {
            this.configure_filter_values(filtered, { filter });
        }
        await this.setState({ filtered, page: 1, page_select: 1, sorted: undefined });
        this.sort_data();
    }

    sort_data = () => {
        if (this.props.sort_columns && this.state.sort) {
            let sort_function;
            let column_sort = this.props.sort_columns[this.state.sort.column];
            if (column_sort) {
                let { column } = this.state.sort;
                if ("filter" in column_sort) {
                    if (column_sort.filter === 'alphabetical') {
                        if (this.state.sort.direction === 'asc')
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(b[column])) return 1;
                                if (nullUndefined(a[column])) return -1;
                                return a[column]?.localeCompare(b[column]);
                            }
                        else
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(a[column])) return 1;
                                if (nullUndefined(b[column])) return -1;
                                return b[column]?.localeCompare(a[column]);
                            }
                    }
                    else if (column_sort.filter === 'numerical') {
                        if (this.state.sort.direction === 'asc')
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(b[column])) return 1;
                                if (nullUndefined(a[column])) return -1;
                                return parseFloat(a[column]) - parseFloat(b[column]);
                            }
                        else
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(a[column])) return 1;
                                if (nullUndefined(b[column])) return -1;
                                return parseFloat(b[column]) - parseFloat(a[column]);
                            }
                    }
                    else if (column_sort.filter === 'date') {
                        if (this.state.sort.direction === 'asc')
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(b[column])) return 1;
                                if (nullUndefined(a[column])) return -1;
                                return new Date(a[column])?.getTime() - new Date(b[column])?.getTime();
                            }
                        else
                            sort_function = (a: any, b: any) => {
                                if (nullUndefined(a[column])) return 1;
                                if (nullUndefined(b[column])) return -1;
                                return new Date(b[column])?.getTime() - new Date(a[column])?.getTime();
                            }
                    }
                }
                else {
                    sort_function = this.state.sort.direction === 'asc' ? column_sort.filter_asc : column_sort.filter_desc;
                }

                // let { filtered, sorted } = this.state;
                let sorted = this.state.sorted || [...this.state.filtered];
                sorted.sort(sort_function);
                this.setState({ sorted })
            }
        }
    }

    get_data = () => {
        if (this.state.filtered) {
            let { rows, page } = this.state;
            let last_page = this.get_last_page();
            let pagination_max = page > last_page ? last_page : page;
            let data = this.state.sorted ? this.state.sorted : this.state.filtered;
            return data.slice(
                rows * (page - 1),
                rows * pagination_max,
            );
        }
        else {
            return null;
        }
    }

    sort_data_click = async (column: number, direction?: 'asc' | 'desc') => {
        if (direction) {
            if (this.state.sort) {
                if (this.state.sort.column === column && this.state.sort.direction === direction)
                    return await this.setState({ sort: undefined, sorted: undefined })
            }
        }
        else {
            if (column === this.state.sort?.column) {
                if (this.state.sort.direction === 'asc')
                    direction = 'desc';
                else return await this.setState({ sort: undefined, sorted: undefined })
            }
            else {
                direction = 'asc';
            }
        }
        await this.setState({
            sort: { column, direction }
        })
        this.sort_data();
    }

    export_data = async (format: string) => {
        this.setState({ exporting: format })
        try {
            let data = (this.state.sorted || this.state.filtered).map((row: Array<string>) => {
                let d: any = {};
                this.state.data_headers?.forEach((h, i) => {
                    d[h] = nullUndefined(row[i]) ? null : row[i];
                })
                return d;
            });

            let name = this.props.export_name || 'export'
            let res = await request(`${APP_URL}/api/user-manager/v1/utils/export`, {
                method: 'post',
                data: {
                    name,
                    format,
                    data
                },

            })

            if (res.headers?.["content-disposition"]) {
                let a = document.createElement('a');
                document.body.appendChild(a);
                a.download = res.headers["content-disposition"].split("filename=")[1].replace(/\"/g, '');
                a.href = window.URL.createObjectURL(
                    new Blob([format === 'json' ? JSON.stringify(res.data, null, 4) : res.data], { type: res.headers['content-type'] })
                );
                a.click();
                document.body.removeChild(a);
            }
        }
        catch (e) {
            requestError(e);
            // axiosErrorHandler(e, { functionName: `export_data` });
            // toast_request_error(e);
        }
        finally {
            this.setState({ exporting: undefined })
        }
    }

    headerContent = (header: ReactNode, idx: number) => (
        <>
            {
                this.props.header?.(header, idx) || header
            }
        </>
    )

    render() {
        let last_page = this.get_last_page();
        return (
            <div className="csv-table">
                {
                    this.props.filters &&
                    <div className="csv-table-filters">
                        {
                            this.props.filters.map((filter, fkey) => {
                                return (
                                    this.state.filter_values?.[filter.index] &&
                                    this.state.selected_filters?.[filter.index] &&
                                    <SelectFilter
                                        key={fkey}
                                        label={filter.label || this.state.headers?.[filter.index]}
                                        filters={this.state.filter_values?.[filter.index]}
                                        values={this.state.selected_filters?.[filter.index]}
                                        onChange={() => {
                                            this.filter_data(filter);
                                        }}
                                    />
                                );
                            })
                        }
                    </div>
                }
                <div className="csv-table-top-bar">
                    <TableSearchInput
                        value={this.state.search}
                        onChange={async (e: any) => {
                            await this.setState({
                                search: e.target.value
                            })
                            this.filter_data()
                        }}
                    />

                    {
                        this.props.export &&
                        <div
                            className={classNames({
                                "csv-table-export": true,
                                "disabled": !this.state.filtered
                            })}
                        >
                            <label><i className="fas fa-download" /> EXPORT</label>
                            <a
                                className={classNames({
                                    "custom-button small inverted": true,
                                    "disabled": !this.state.filtered || this.state.exporting === 'json'
                                })}
                                onClick={() => { this.export_data('json') }}
                            >
                                {
                                    this.state.exporting === 'json' ?
                                        <div className="centered"><LoadingIcon white size={15} /></div>
                                        :
                                        'JSON'
                                }
                            </a>
                            <a
                                className={classNames({
                                    "custom-button small inverted": true,
                                    "disabled": !this.state.filtered || this.state.exporting === 'csv'
                                })}
                                onClick={() => { this.export_data('csv') }}
                            >
                                {
                                    this.state.exporting === 'csv' ?
                                        <div className="centered"><LoadingIcon white size={15} /></div>
                                        :
                                        'CSV'
                                }
                            </a>
                        </div>
                    }
                </div>
                <div className="csv-table-results">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {
                                    this.props.operations &&
                                    <th>

                                    </th>
                                }
                                {
                                    this.state.headers?.map?.((header, hkey) => {
                                        if (this.props.hide_rows?.includes(hkey)) return null;
                                        if (this.props.sort_columns && hkey in this.props.sort_columns) {
                                            return <th
                                                key={hkey}
                                                className={classNames({
                                                    "csv-table-sowrapper": true,
                                                    "active": this.state.sort?.column === hkey
                                                })}
                                            >
                                                <div
                                                    className={classNames({
                                                        "csv-table-sort": true,
                                                        "active": this.state.sort?.column === hkey
                                                    })}
                                                    onClick={(e) => { e.stopPropagation(); this.sort_data_click(hkey) }}
                                                >
                                                    <div className={classNames({
                                                        "csv-table-socolumn": true
                                                    })}>
                                                        {this.headerContent(header, hkey)}
                                                    </div>
                                                    <div className="csv-table-sodirections">
                                                        <div
                                                            className={classNames({
                                                                "csv-table-sodirection": true,
                                                                "active": this.state.sort?.column === hkey && this.state.sort?.direction === 'asc'
                                                            })}
                                                            onClick={(e) => { e.stopPropagation(); this.sort_data_click(hkey, "asc") }}
                                                        >
                                                            <i className="fas fa-soup" />
                                                        </div>
                                                        <div
                                                            className={classNames({
                                                                "csv-table-sodirection": true,
                                                                "active": this.state.sort?.column === hkey && this.state.sort?.direction === 'desc'
                                                            })}
                                                            onClick={(e) => { e.stopPropagation(); this.sort_data_click(hkey, 'desc') }}
                                                        >
                                                            <i className="fas fa-sodown" />
                                                        </div>
                                                    </div>

                                                </div>
                                            </th>
                                        }
                                        return <th key={hkey}>
                                            {this.headerContent(header, hkey)}
                                        </th>;
                                    })
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.get_data()?.map((row: Array<string>, key: number) => (
                                    <tr key={key}>
                                        {
                                            this.props.operations &&
                                            <th>
                                                {this.props.operations(row, key)}
                                            </th>
                                        }
                                        {
                                            row.map((value: string, rkey: number) => {
                                                if (this.props.hide_rows?.includes(rkey)) return null;
                                                return <td key={rkey}>{value}</td>
                                            })
                                        }
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                <div className="table-bottom-bar">
                    {/* =====================================
                        PAGINATION
                        =====================================*/}
                    <div className="table-pagination-bar">
                        <SelectInputField
                            options={[5, 10, 20, 50].map((v: number) => {
                                return { value: v, label: v }
                            })}
                            value={this.state.rows}
                            onChange={(rows: number) => {
                                this.setState({ rows, page: 1, page_select: 1 })
                            }}
                        />
                        <div
                            className={classNames({
                                "table-pagination": true,
                                "disabled": this.state.page === 1
                            })}
                            onClick={() => {
                                let page = this.state.page - 1;
                                this.setState({ page, page_select: page })
                            }}
                        >
                            <i className="fas fa-chevron-left" />
                        </div>

                        <div className="table-pagination-value">
                            <input
                                className="pagination-input"
                                type="number"
                                min={1}
                                max={last_page}
                                value={this.state.page_select}
                                onChange={(e: any) => {
                                    this.setState({
                                        page_select: e.target.value
                                    })
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        this.set_last_page()
                                    }
                                }}
                            />
                            {
                                this.state.page !== this.state.page_select &&
                                <div
                                    className="table-pagination-value-validate"
                                    onClick={this.set_last_page}
                                >
                                    <i className="fas fa-check" />
                                </div>
                            }
                            {
                                <div className="table-pagination-last-page">
                                    <span>OF</span> {last_page}
                                </div>
                            }

                        </div>

                        <div
                            className={classNames({
                                "table-pagination": true,
                                "disabled": !(this.state.page < last_page)
                            })}
                            onClick={() => {
                                let page = this.state.page + 1;
                                this.setState({ page, page_select: page })
                            }}
                        >
                            <i className="fas fa-chevron-right" />
                        </div>

                    </div>

                    {/* =====================================
                        PAGINATION INFO
                        =====================================*/}
                    <div className="pagination-info">
                        <div className="pagination-rows">
                            {((this.state.page - 1) * this.state.rows) + 1}
                            -
                            {
                                this.state.page < last_page ?
                                    ((this.state.page) * this.state.rows)
                                    :
                                    this.state.filtered?.length

                            }
                        </div>
                        <div className="pagination-count">
                            COUNT
                            <div className="pagination-count-value">{this.state.filtered?.length}</div>
                        </div>
                    </div>

                </div>

            </div>
        );
    }

    set_last_page = () => {
        if (this.state.page !== this.state.page_select) {
            let last_page = this.get_last_page();
            let page_select: any = this.state.page_select;
            let page;
            if (page_select === '') page = 1;
            else {
                page_select = parseInt(page_select);
                if (page_select >= last_page)
                    page = last_page;
                else if (page_select < 1)
                    page = 1
                else page = page_select
            }

            this.setState({ page, page_select: page })
        }
    }

    get_last_page = () => {
        if (!this.state.filtered) return -1;
        return Math.ceil(this.state.filtered.length / this.state.rows)
    }





};
