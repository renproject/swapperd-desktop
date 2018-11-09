
import btc from '../styles/images/btc.svg';
import eth from '../styles/images/eth.svg';
import swap from '../styles/images/swap.svg';
import wbtc from '../styles/images/wbtc.png';

export const getLogo = (symbol: string) => {
    switch (symbol) {
        case "WBTC":
            return wbtc;
        case "BTC":
            return btc;
        case "ETH":
            return eth;
        default:
            return swap;
    }
}