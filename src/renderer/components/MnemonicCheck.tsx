import * as React from "react";

import { Banner } from "./Banner";

interface IMnemonicCheckProps {
    mnemonic: string;
    wordsToCheck?: number;
    onFinish(): void;
    onBack(): void;
}

interface IMnemonicCheckState {
    accepted: boolean;
    mnemonic: string[];
    indices: number[];
    wordsToCheck: number;
    // tslint:disable-next-line:no-any
    formValues: any;
}

interface ICustomInputProps {
    word: string;
    placeholder?: string;
    onChange?(event: React.FormEvent<HTMLInputElement>): void;
}

interface ICustomInputState {
    wordInput: string;
}

class CustomInput extends React.Component<ICustomInputProps, ICustomInputState> {
    constructor(props: ICustomInputProps) {
        super(props);
        this.state = {
            wordInput: "",
        };
    }

    public render() {
        const { wordInput } = this.state;
        const { word, placeholder } = this.props;
        const correct = wordInput === word;
        return (
            <div className={`mnemonic--word--input ${!wordInput ? "" : correct ? "valid" : "invalid"}`}>
                <input type="text" name="wordInput" value={wordInput} onChange={this.handleInput} placeholder={placeholder} />
            </div>
        );
    }

    private readonly handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
        if (this.props.onChange) {
            this.props.onChange(event);
        }
    }

}

export class MnemonicCheck extends React.Component<IMnemonicCheckProps, IMnemonicCheckState> {
    constructor(props: IMnemonicCheckProps) {
        super(props);
        const { mnemonic } = props;
        const splitMnemonic = mnemonic.split(" ");
        const wordsToCheck = this.props.wordsToCheck || splitMnemonic.length;
        this.state = {
            mnemonic: splitMnemonic,
            formValues: {},
            accepted: false,
            wordsToCheck,
            indices: shuffle([...Array(splitMnemonic.length).keys()]).slice(0, wordsToCheck),
        };

    }

    // tslint:disable:no-any
    // tslint:disable:jsx-no-lambda
    public render() {
        const { mnemonic, indices, formValues } = this.state;
        return <div className="mnemonic-check">
            <Banner title="Backup confirmation" />
            <div className="mnemonic">
                <p>To confirm your 12 words have been backed up, please enter the required words.</p>
                <div className="mnemonic--check">
                    {
                        indices.map((element: number, index: number) => {
                            // tslint:disable-next-line:react-this-binding-issue
                            return <CustomInput onChange={(event: any) => { this.handleInputChange(event, mnemonic[element]); }} key={index} word={mnemonic[element]} placeholder={`Word no. ${element + 1}`} />;
                        })
                    }
                </div>
                <div className="input-group">
                    <button className="secondary" onClick={this.props.onBack}>Back</button>
                    <button disabled={!this.isValid(formValues)} onClick={this.props.onFinish}>Continue</button>
                </div>
            </div>
        </div>;
    }

    private readonly handleInputChange = (event: React.FormEvent<HTMLInputElement>, inputPropName: string): void => {
        const newState = { ...this.state };
        newState.formValues[inputPropName] = (event.target as HTMLInputElement).value;
        this.setState(newState);
    }

    private readonly isValid = (formValues: any): boolean => {
        const { wordsToCheck } = this.state;
        const keys = Object.keys(formValues);
        if (keys.length !== wordsToCheck) {
            console.log(false, "keys.length !== wordsToCheck", keys.length !== wordsToCheck, keys.length, wordsToCheck);
            return false;
        }
        for (const key of keys) {
            if (key !== formValues[key]) {
                console.log(false, "key !== formValues[key]", key !== formValues[key], key, formValues[key]);
                return false;
            }
        }
        console.log(true);
        return true;
    }
    // tslint:enable:jsx-no-lambda
    // tslint:enable:no-any
}

// Taken from: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        // tslint:disable-next-line:insecure-random
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
