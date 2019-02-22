// tslint:disable:no-any

import * as React from "react";

import { Subscribe } from "unstated";

export interface ConnectedProps {
    containers: any[];
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Typesafe version of https://github.com/goncy/unstated-connect
export function connect<X extends ConnectedProps>(_containers: any[]) {
    return (_component: React.ComponentClass<X>) => (props: Omit<X, "containers">) => (
        <Subscribe to={_containers}>
            {(...containers) => <React.Component {...({ ...props, containers: containers } as unknown as X)} />}
        </Subscribe>
    );
}

// tslint:enable:no-any
