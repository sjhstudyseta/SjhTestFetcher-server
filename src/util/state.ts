export type State = {
    priority: boolean,
    default: boolean,
    cookie: string,

    update: (isAuthenticated: boolean, value: boolean) => void;
}

export const state: State = {
    priority: false,
    default: false,
    cookie: "",

    update: (isAuthenticated, value) => {
        if (isAuthenticated) state.priority = value;
        else state.default = value;
    }
}