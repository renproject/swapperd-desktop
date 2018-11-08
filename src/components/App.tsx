import * as React from 'react';

import '../styles/App.css';

import ApproveSwap from './ApproveSwap';
import Listening from './Listening';

export interface ISwapRequest extends IPartialSwapRequest {
    id: string,
    timeLock: number,
    secretHash: string,
}

export interface IPartialSwapRequest {
    sendToken: string,
    receiveToken: string,

    // SendAmount and ReceiveAmount are hex encoded.
    sendAmount: string,
    receiveAmount: string,

    sendTo: string,
    receiveFrom: string,
    shouldInitiateFirst: boolean,
}

interface IAppState {
    swapDetails: IPartialSwapRequest | null;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            swapDetails: null,
        }
    }

    public componentDidMount() {
        // chrome.runtime.sendMessage({ method: 'getswapDetails' }, (response) => {
        //     this.setState({ swapDetails: response.swapDetails });
        // });
    }

    public render() {
        const { swapDetails } = this.state;
        return (
            <div className="app">
                {swapDetails === null ?
                    <Listening /> :
                    <ApproveSwap swapDetails={swapDetails} />
                }
            </div>
        );
    }
}

export default App;
