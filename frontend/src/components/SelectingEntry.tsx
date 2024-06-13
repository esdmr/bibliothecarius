import type {Signal} from '@preact/signals';
import {useId} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Card from 'react-bootstrap/esm/Card.js';
import CardBody from 'react-bootstrap/esm/CardBody.js';
import CardFooter from 'react-bootstrap/esm/CardFooter.js';
import CardHeader from 'react-bootstrap/esm/CardHeader.js';
import Form from 'react-bootstrap/esm/Form.js';
import type {Route} from '../backend.js';
import {useRefSignalRecord} from '../signal-record.js';
import {EntryFields} from './EntryFields.js';

export const SelectingEntry = ({
    input,
    data,
    route,
}: {
    input: Signal;
    data: Record<string, any>;
    route: Route;
}) => {
    const formId = useId();
    const inputs = useRefSignalRecord(data, route);

    return (
        <Card>
            <CardHeader>
                {route.singular} {data[route.key]}
            </CardHeader>
            <CardBody>
                <Form
                    id={formId}
                    onSubmit={(event: Event) => {
                        event.preventDefault();
                    }}
                >
                    <EntryFields
                        inputs={inputs}
                        route={route}
                        formId={formId}
                        disabled
                    />
                </Form>
            </CardBody>
            <CardFooter>
                <Button
                    variant="primary"
                    type="button"
                    onClick={() => {
                        input.value = data;
                    }}
                >
                    Select
                </Button>
            </CardFooter>
        </Card>
    );
};
