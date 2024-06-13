import {useComputed, type Signal} from '@preact/signals';
import type {Route} from '../backend.js';
import {ReadonlyEntry} from './ReadonlyEntry.js';
import {EntryList} from './EntryList.js';

export const NestedEntry = ({
    input,
    route,
    nullable = false,
    disabled,
}: {
    input: Signal;
    route: Route;
    nullable?: boolean;
    disabled?: boolean | Signal<boolean>;
}) => {
    return (
        <>
            {useComputed(() =>
                input.value ? (
                    <ReadonlyEntry
                        data={input.value}
                        route={route}
                        nullable={nullable}
                        onRemove={() => {
                            input.value = undefined;
                        }}
                        disabled={disabled ?? false}
                        key="entry"
                    />
                ) : disabled?.valueOf() ? (
                    <input>null</input>
                ) : (
                    <EntryList input={input} route={route} />
                ),
            )}
        </>
    );
};
