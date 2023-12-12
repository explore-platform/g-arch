import { configureStore } from '@reduxjs/toolkit'
import app from './reducers/app';
import general from './reducers/general';
import files from './reducers/files';

export const store = configureStore({
    reducer: {
        general,
        app,
        files
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export type ReduxAction<T> = (payload: Partial<T>) => void