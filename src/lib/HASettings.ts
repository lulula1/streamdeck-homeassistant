import type { ActionEvent } from "./StreamDeck";

export interface SettingVariable<T> {
    value: T;
    isVariable?: boolean;
}

export interface HASettings {
    domain: SettingVariable<string>;
    service: SettingVariable<string>;
    state: SettingVariable<string>;
    iconVariant: number;
    profile?: string;
}

export type ActionEventHA = ActionEvent<HASettings>;
