import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { AppFile } from '../../utils/files'


export interface FilesState {
    loading: boolean
    files?: AppFile[]
    plotableFolders?: string[]
}

const initialState: FilesState = {
    loading: false
}

export const slice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setFiles: (state: FilesState, action: PayloadAction<Partial<FilesState>>) =>{
            const { payload } = action;
            Object.assign(state, payload);
        }
    },
})
export const { setFiles } = slice.actions

export default slice.reducer
