import {signal, type Signal} from '@preact/signals';
import {useRef} from 'preact/hooks';
import type {Route} from './backend.js';

export const createSignalRecord = (data: Record<string, any>, route: Route) =>
    Object.fromEntries(
        Object.keys(route.schema).map((k) => [k, signal(data[k])]),
    );

// eslint-disable-next-line unicorn/prevent-abbreviations
export const useRefSignalRecord = (data: Record<string, any>, route: Route) => {
    const record = useRef<Record<string, Signal>>(undefined as never);
    record.current ??= createSignalRecord(data, route);
    return record;
};
