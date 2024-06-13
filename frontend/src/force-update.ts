import {useState} from 'preact/hooks';

export function useForceUpdate() {
    const [state, setState] = useState(false);

    return () => {
        setState(!state);
    };
}
