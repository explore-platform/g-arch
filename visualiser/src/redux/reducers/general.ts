import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'


export interface GeneralState {
    // location?: Location,
}

const initialState: GeneralState = {
}

export const slice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setGeneral: (state: GeneralState, action: PayloadAction<Partial<GeneralState>>) =>{
            const { payload } = action;
            Object.assign(state, payload);
        }
    },
})
export const { setGeneral } = slice.actions

export default slice.reducer
