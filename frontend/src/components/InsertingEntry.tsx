import {useSignal, type Signal} from '@preact/signals';
import {useId, type MutableRef} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Card from 'react-bootstrap/esm/Card.js';
import CardBody from 'react-bootstrap/esm/CardBody.js';
import CardFooter from 'react-bootstrap/esm/CardFooter.js';
import CardHeader from 'react-bootstrap/esm/CardHeader.js';
import Form from 'react-bootstrap/esm/Form.js';
import {backend, createFromRoute, type Route} from '../backend.js';
import {useRefSignalRecord} from '../signal-record.js';
import {authorization} from '../token.js';
import {EntryFields} from './EntryFields.js';
import {usePages} from './MainMenu.js';

async function insert(
    inputs: MutableRef<Record<string, Signal>>,
    route: Route,
) {
    const newData: Record<string, any> = {};

    for (const [key, {type}] of Object.entries(route.schema)) {
        const value = inputs.current[key]!.value;

        if (typeof type === 'object') {
            newData[`${key}_${type.key}`] = value[type.key];
        } else {
            newData[key] = value;
        }
    }

    const response = await fetch(new URL(route.url, backend), {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization.value,
        },
        body: JSON.stringify(newData),
    });

    if (!response.ok) {
        throw new Error(`Failed to insert ${route.singular}`, {
            cause: await response.text(),
        });
    }

    return response.json();
}

export const InsertingEntry = ({route}: {route: Route}) => {
    const formId = useId();
    const inputs = useRefSignalRecord(createFromRoute(route), route);
    const isSubmitting = useSignal(false);
    const pages = usePages();

    return (
        <Card>
            <CardHeader>New {route.singular}</CardHeader>
            <CardBody>
                <Form
                    id={formId}
                    onSubmit={async (event: Event) => {
                        event.preventDefault();
                        isSubmitting.value = true;

                        try {
                            pages.close(await insert(inputs, route));
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
                    Insert
                </Button>
            </CardFooter>
        </Card>
    );
};
