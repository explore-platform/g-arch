import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Star } from '../../components/StarSelect/StarSelect'

export type SpectrumPlot = {
    folder: string
    index: number
}

export interface AppState {
    initialised: boolean
    elements?: string[],
    plotSpectrum?: SpectrumPlot
    stars?: Star[]
}

const initialState: AppState = {
    initialised: false,
    elements: undefined,
    // plotSpectrum: {
    //     folder: "2023-03-23T16-58-15",
    //     index: 0
    // }
}

export const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setApp: (state: AppState, action: PayloadAction<Partial<AppState>>) =>{
            const { payload } = action;
            Object.assign(state, payload);
        }
    },
})
export const { setApp } = slice.actions

export default slice.reducer
