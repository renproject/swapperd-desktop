import * as React from "react";

import BigNumber from "bignumber.js";

import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { SwapItem } from "@/components/SwapItem";
import { TransferItem } from "@/components/TransferItem";
import { ipc } from "@/ipc";
import { ISwapItem, ISwapsResponse, ITransferItem, ITransfersResponse } from "@/lib/swapperd";
import { NotifyRequest } from "common/ipc";

interface ISwapsProps {
    swaps: ISwapsResponse | null;
    transfers: ITransfersResponse | null;
}

enum Tab {
    Swaps,
    Transfers,
}

interface ISwapsState {
    selected: Tab;
    pendingSwaps: ISwapItem[];
    pendingTransfers: ITransferItem[];
}

export class Swaps extends React.Component<ISwapsProps, ISwapsState> {
    constructor(props: ISwapsProps) {
        super(props);
        this.state = {
            selected: Tab.Swaps,
            pendingSwaps: [],
            pendingTransfers: [],
        };
    }

    public componentDidMount(): void {
        const { swaps, transfers } = this.props;
        if (swaps && swaps.swaps) {
            const pendingSwaps = this.pendingSwaps(swaps.swaps);
            this.setState({ pendingSwaps });
        }
        if (transfers && transfers.transfers) {
            const pendingTransfers = this.pendingTransfers(transfers.transfers);
            this.setState({ pendingTransfers });
        }
    }

    public componentWillReceiveProps(nextProps: ISwapsProps): void {
        const { swaps, transfers } = nextProps;
        if (swaps && swaps.swaps) {
            const pendingSwaps = this.pendingSwaps(swaps.swaps);
            if (pendingSwaps.length < this.state.pendingSwaps.length) {
                const notPending = this.state.pendingSwaps.filter((current) => {
                    return pendingSwaps.filter((other) => {
                        return other.id === current.id;
                    }).length === 0;
                });
                for (const swap of notPending) {
                    // Retrieve the new status of the swap.
                    const newSwap = swaps.swaps.find(x => x.id === swap.id);
                    if (!newSwap) {
                        continue;
                    }
                    let status;
                    switch (newSwap.status) {
                        case 5:
                            status = "confirmed";
                            break;
                        case 9:
                            status = "canceled";
                            break;
                        default:
                            status = "failed";
                    }
                    const sendCost = newSwap.sendCost[newSwap.sendToken] ? newSwap.sendCost[newSwap.sendToken] : 0;
                    const receiveCost = newSwap.receiveCost[newSwap.receiveToken] ? newSwap.receiveCost[newSwap.receiveToken] : 0;
                    const sendAmount = new BigNumber(newSwap.sendAmount).plus(new BigNumber(sendCost)).toFixed();
                    const receiveAmount = new BigNumber(newSwap.receiveAmount).minus(new BigNumber(receiveCost)).toFixed();
                    const notificationMessage = `Swap from ${sendAmount} ${newSwap.sendToken} to ${receiveAmount} ${newSwap.receiveToken} ${status}.`;
                    ipc.sendToMain<NotifyRequest>(
                        "notify",
                        { notification: notificationMessage },
                    );
                }
            }
            if (pendingSwaps !== this.state.pendingSwaps) {
                this.setState({ pendingSwaps });
            }
        }
        if (transfers && transfers.transfers) {
            const pendingTransfers = this.pendingTransfers(transfers.transfers);
            if (pendingTransfers.length < this.state.pendingTransfers.length) {
                const notPending = this.state.pendingTransfers.filter((current) => {
                    return pendingTransfers.filter((other) => {
                        return other.txHash === current.txHash;
                    }).length === 0;
                });
                for (const transfer of notPending) {
                    ipc.sendToMain<NotifyRequest>(
                        "notify",
                        { notification: `${transfer.value} ${transfer.token.name} transfer confirmed.` },
                    );
                }
            }
            if (pendingTransfers !== this.state.pendingTransfers) {
                this.setState({ pendingTransfers });
            }
        }
    }

    public render(): JSX.Element {
        const { swaps, transfers } = this.props;
        const { selected } = this.state;
        return (
            <>
                <Banner title="History" />
                <ul className="tabs">
                    <li role="tab" className={selected === Tab.Swaps ? "active" : ""} onClick={this.showSwaps}>Swaps</li>
                    <li role="tab" className={selected === Tab.Transfers ? "active" : ""} onClick={this.showTransfers}>Transfers</li>
                </ul>
                {selected === Tab.Swaps ?
                    <div className="swaps">
                        {swaps !== null ?
                            swaps.swaps !== null ?
                                swaps.swaps.sort((a, b) => {
                                    // Sort by timestamp in descending order
                                    if (a.timestamp < b.timestamp) {
                                        return 1;
                                    } else if (a.timestamp > b.timestamp) {
                                        return -1;
                                    } else {
                                        return a.id.localeCompare(b.id);
                                    }
                                }).map((swap, index) => {
                                    return <SwapItem key={index} swapItem={swap} />;
                                })
                                :
                                <p>You have no transactions.</p>
                            :
                            <Loading />
                        }
                    </div>
                    :
                    <div className="swaps">
                        {transfers !== null ?
                            transfers.transfers !== null && transfers.transfers.length > 0 ?
                                transfers.transfers.sort((a, b) => {
                                    // Sort by timestamp in descending order
                                    if (a.timestamp < b.timestamp) {
                                        return 1;
                                    } else if (a.timestamp > b.timestamp) {
                                        return -1;
                                    } else {
                                        return a.txHash.localeCompare(b.txHash);
                                    }
                                }).map((transfer, index) => {
                                    return <TransferItem key={index} transferItem={transfer} />;
                                })
                                :
                                <p>You have no transactions.</p>
                            :
                            <Loading />
                        }
                    </div>
                }
            </>
        );
    }

    private readonly showSwaps = () => {
        this.setState({ selected: Tab.Swaps });
    }

    private readonly showTransfers = () => {
        this.setState({ selected: Tab.Transfers });
    }

    private pendingSwaps(swaps: ISwapItem[]): ISwapItem[] {
        const pending = [];
        for (const swap of swaps) {
            if (swap.status === 0 || swap.status === 1 || swap.status === 2 || swap.status === 3 || swap.status === 6 || swap.status === 8) {
                pending.push(swap);
            }
        }
        return pending;
    }

    private pendingTransfers(transfers: ITransferItem[]): ITransferItem[] {
        const pending = [];
        for (const transfer of transfers) {
            if (transfer.confirmations < 1) {
                pending.push(transfer);
            }
        }
        return pending;
    }
}
