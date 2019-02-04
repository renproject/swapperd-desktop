import moment from "moment";

export interface INaturalTimeOptions {
    message: string;  // The default string to return for current time
    suffix: string; // The suffix at the end of the string
    countDown: boolean; // Whether counting up or down
    showingSeconds: boolean; // Whether to include seconds or not
}

export const naturalTime = (expiry: number, options: INaturalTimeOptions) => {
    let diff;
    if (!options.countDown) {
        diff = moment.duration(moment().diff(moment.unix(expiry)));
    } else {
        diff = moment.duration(moment.unix(expiry).diff(moment()));
    }
    let days = diff.asDays();
    let hours = diff.asHours();
    let minutes = diff.asMinutes();
    let seconds = diff.asSeconds();

    const suffix = options.suffix ? ` ${options.suffix}` : "";

    if (days > 2) {
        days = Math.round(days);
        return `${days} ${days === 1 ? "day" : "days"}${suffix}`;
    }
    if (hours >= 1) {
        // Round to the closest hour
        hours = Math.round(hours);
        return `${hours} ${hours === 1 ? "hour" : "hours"}${suffix}`;
    } else if (minutes >= 1) {
        minutes = Math.round(minutes);
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"}${suffix}`;
    } else if (options.showingSeconds && seconds >= 1) {
        seconds = Math.floor(seconds);
        return `${seconds} ${seconds === 1 ? "second" : "seconds"}${suffix}`;
    } else {
        return `${options.message}`;
    }
};