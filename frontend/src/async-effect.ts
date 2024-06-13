import {useEffect, type Inputs} from 'preact/hooks';

export function useAsyncEffect(
    effectFunction: (argument0: (function_: any) => any) => void,
    deps?: Inputs,
) {
    useEffect(() => {
        let cleanupFunction: any;
        effectFunction((function_) => {
            cleanupFunction = function_;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return () => cleanupFunction?.();
    }, deps);
}
