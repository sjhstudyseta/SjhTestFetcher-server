// server running state & cookie storage
export type State = {
    priority: boolean,
    default: boolean,
    cookie: string | null,

    update: (isAuthenticated: boolean, value: boolean) => void;
    running: (isAuthenticated?: boolean) => boolean;
}

const state: State = {
    priority: false,
    default: false,
    cookie: null,

    update: (isAuthenticated, value) => {
        if (isAuthenticated) state.priority = value;
        else state.default = value;
    },
    running(isAuthenticated) {
        if (isAuthenticated === undefined) 
            return state.default || state.priority;

        return isAuthenticated === true ? state.default : state.priority;   // only check opposite
    }
}

export default state;