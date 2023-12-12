import React from 'react';
import { MATISSE_VERSION } from '../../utils/global';
import './AppInfo.css';

declare const APP_VERSION:string;

export const AppInfo = () =>{
    return (
        <div className="app-info">
            <p>
                { APP_VERSION }
            </p>
            <p>
                { import.meta.env.VITE_BUILD_DATE }
            </p>
            <p>
                Matisse { MATISSE_VERSION }
            </p>
        </div>
    )
}