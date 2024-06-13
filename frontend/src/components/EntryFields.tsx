import {type Signal} from '@preact/signals';
import {type MutableRef} from 'preact/hooks';
import Col from 'react-bootstrap/esm/Col.js';
import FormControl from 'react-bootstrap/esm/FormControl.js';
import FormLabel from 'react-bootstrap/esm/FormLabel.js';
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput.js';
import type {ChangeEvent} from 'preact/compat';
import type {Route} from '../backend.js';
import {NestedEntry} from './NestedEntry.js';

export function commit(
    inputs: MutableRef<Record<string, Signal>>,
    data: Record<string, any>,
    route: Route,
) {
    for (const key of Object.keys(route.schema)) {
        data[key] = inputs.current[key]!.value;
    }
}

export function reset(
    inputs: MutableRef<Record<string, Signal>>,
    data: Record<string, any>,
    route: Route,
) {
    for (const key of Object.keys(route.schema)) {
        inputs.current[key]!.value = data[key];
    }
}

export const EntryFields = ({
    inputs,
    route,
    formId,
    disabled,
}: {
    inputs: MutableRef<Record<string, Signal>>;
    route: Route;
    formId: string;
    disabled?: boolean | Signal<boolean>;
}) => {
    return (
        <>
            {Object.entries(route.schema).map(
                ([key, {type, nullable, secret}]) => {
                    const id = `${formId}__${key}`;

                    const Input =
                        type === Boolean ? FormCheckInput : FormControl;

                    return typeof type === 'object' ? (
                        <Col key={key}>
                            <NestedEntry
                                input={inputs.current[key]!}
                                route={type}
                                nullable={nullable ?? false}
                                disabled={disabled ?? false}
                            />
                        </Col>
                    ) : (
                        <Col key={key}>
                            <FormLabel for={id}>{key}</FormLabel>
                            <Input
                                id={id}
                                type={
                                    (type === Number
                                        ? 'number'
                                        : type === Boolean
                                          ? 'checkbox'
                                          : secret
                                            ? 'password'
                                            : 'text') as never
                                }
                                disabled={disabled as never}
                                value={inputs.current[key] as never}
                                checked={inputs.current[key] as never}
                                onInput={(event: InputEvent) => {
                                    const element =
                                        event.currentTarget as HTMLInputElement;
                                    inputs.current[key]!.value =
                                        type === Number
                                            ? element.valueAsNumber
                                            : type === Boolean
                                              ? element.checked
                                              : element.value;
                                }}
                                onChange={(event: ChangeEvent) => {
                                    const element =
                                        event.currentTarget as HTMLInputElement;
                                    inputs.current[key]!.value =
                                        type === Number
                                            ? element.valueAsNumber
                                            : type === Boolean
                                              ? element.checked
                                              : element.value;
                                }}
                            />
                        </Col>
                    );
                },
            )}
        </>
    );
};
