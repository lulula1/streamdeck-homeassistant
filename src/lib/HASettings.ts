import type { ActionEvent } from "./StreamDeck";

export interface SettingVariable<T> {
    value: T;
    isVariable?: boolean;
}

export interface HAActionSettings {
    domain: SettingVariable<string>;
    service: SettingVariable<string>;
    state: SettingVariable<string>;
    serviceConfig: Array<{ fieldId: string, value: any }>;
    iconVariant: number;
    profile?: string;
}

export type ActionEventHA = ActionEvent<HAActionSettings>;
