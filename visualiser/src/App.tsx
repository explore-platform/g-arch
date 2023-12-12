import { Component } from 'react'
import './App.css'
import { connect } from 'react-redux'
import LoadingPage from './pages/LoadingPage/LoadingPage'
import { ReduxAction, RootState } from './redux/store'
import { AppState, setApp } from './redux/reducers/app'
import HomePage from './pages/HomePage/HomePage'
import { initWebsocket } from './utils/websocket'
import { AppInfo } from './components/AppInfo/AppInfo'
import { fetchElements } from './utils/elements'
import { fetchStarsList } from './utils/files'

interface State{

}
interface Props{
    app: AppState
    setApp: ReduxAction<AppState>
}

class App extends Component<Props, State>{
    async componentDidMount(): Promise<void> {
        initWebsocket();
        await fetchElements();
        await fetchStarsList();
        this.props.setApp({ initialised: true });

    }
    render(){
        return (
            <div id="app" className="app">
                <AppInfo/>
                {
                    !this.props.app.initialised ?
                        <LoadingPage/>
                    :
                        <HomePage/>
                        // <BrowserRouter>
                        //     <Routes>
                        //         <Route path='/' element={<HomePage/>}/>
                        //         <Route path='/sda' element={<>No bueno</>}/>
                        //     </Routes>
                        // </BrowserRouter>
                }
            </div>
        )
    }    
}

export default connect(({ app }:RootState)=>{
    return {
        app
    }
}, { setApp })(App)
