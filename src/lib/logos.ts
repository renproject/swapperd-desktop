import btc from "../styles/images/btc.svg";
import dgx from "../styles/images/dgx.svg";
import eth from "../styles/images/eth.svg";
import omg from "../styles/images/omg.svg";
import ren from "../styles/images/ren.svg";
import swap from "../styles/images/swap.svg";
import tusd from "../styles/images/tusd.svg";
import wbtc from "../styles/images/wbtc.png";
import zrx from "../styles/images/zrx.svg";
import gusd from "../styles/images/gusd.svg";
import dai from "../styles/images/dai.svg";
import usdc from "../styles/images/usdc.svg";
import pax from "../styles/images/pax.svg";

export function getLogo(symbol: string) {
    switch (symbol) {
        case "WBTC":
            return wbtc;
        case "BTC":
            return btc;
        case "ETH":
            return eth;
        case "DGX":
            return dgx;
        case "TUSD":
            return tusd;
        case "REN":
            return ren;
        case "ZRX":
            return zrx;
        case "OMG":
            return omg;
        case "GUSD":
            return gusd;
        case "USDC":
            return usdc;
        case "DAI":
            return dai;
        case "PAX":
            return pax;
        default:
            return swap;
    }
}