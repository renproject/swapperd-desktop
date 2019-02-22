// tslint:disable:no-any

import * as React from "react";

import { Subscribe } from "unstated";

export interface ConnectedProps {
    containers: any[];
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/*
export interface ConnectedProps {
    container: AppContainer;
}

// Typesafe version of https://github.com/goncy/unstated-connect
export function connect<X extends ConnectedProps>(_container: typeof AppContainer) {
    return (Component: React.ComponentClass<X>) => (props: Omit<X, "container">) => (
        <Subscribe to={[_container]}>
            {(...containers) => <Component {...({ ...props, container: containers[0] } as unknown as X)} />}
        </Subscribe>
    );
}
*/

export function connect<X extends ConnectedProps>(_containers: any) {
    return (Component: any) => {
        return (props: Omit<X, "containers">) => {
            return (
                <Subscribe to={_containers}>
                    {(...containers) => <Component {...props} containers={containers} />}
                </Subscribe>
            );
        };
    };
}

// tslint:enable:no-any
