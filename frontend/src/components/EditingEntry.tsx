import {useSignal, type Signal} from '@preact/signals';
import {useId, type MutableRef} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Card from 'react-bootstrap/esm/Card.js';
import CardBody from 'react-bootstrap/esm/CardBody.js';
import CardFooter from 'react-bootstrap/esm/CardFooter.js';
import CardHeader from 'react-bootstrap/esm/CardHeader.js';
import Form from 'react-bootstrap/esm/Form.js';
import {backend, type Route} from '../backend.js';
import {useRefSignalRecord} from '../signal-record.js';
import {authorization} from '../token.js';
import {EntryFields, commit, reset} from './EntryFields.js';
import {usePages} from './MainMenu.js';

async function update(
    inputs: MutableRef<Record<string, Signal>>,
    data: Record<string, any>,
    route: Route,
) {
    const newData: Record<string, any> = {};

    for (const [key, {type}] of Object.entries(route.schema)) {
        const value = inputs.current[key]!.value;

        if (typeof type === 'object') {
            if (data[key]?.[type.key] !== value[type.key]) {
                newData[`${key}_${type.key}`] = value[type.key];
            }
        } else if (data[key] !== value) {
            newData[key] = value;
        }
    }

    if (Object.keys(newData).length > 0) {
        const response = await fetch(
            new URL(`${route.url}${data[route.key]}`, backend),
            {
                method: 'patch',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authorization.value,
                },
                body: JSON.stringify(newData),
            },
        );

        if (!response.ok) {
            throw new Error(
                `Failed to update ${route.singular} ${data[route.key]}`,
                {
                    cause: await response.text(),
                },
            );
        }

        commit(inputs, data, route);
    }
}

export const EditingEntry = ({
    data,
    route,
}: {
    data: Record<string, any>;
    route: Route;
}) => {
    const formId = useId();
    const inputs = useRefSignalRecord(data, route);
    const isSubmitting = useSignal(false);
    const pages = usePages();

    return (
        <Card>
            <CardHeader>
                {route.singular} {data[route.key]}
            </CardHeader>
            <CardBody>
                <Form
                    id={formId}
                    onSubmit={async (event: Event) => {
                        event.preventDefault();
                        isSubmitting.value = true;

                        try {
                            await update(inputs, data, route);
                            pages.close(data);
                        } finally {
                            isSubmitting.value = false;
                        }
                    }}
                >
                    <EntryFields
                        inputs={inputs}
                        route={route}
                        formId={formId}
                        disabled={isSubmitting}
                    />
                </Form>
            </CardBody>
            <CardFooter>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting as never}
                    form={formId}
                >
                    Update
                </Button>
                <Button
                    variant="secondary"
                    type="button"
                    disabled={isSubmitting as never}
                    onClick={() => {
                        reset(inputs, data, route);
                    }}
                >
                    Reset
                </Button>
            </CardFooter>
        </Card>
    );
};
