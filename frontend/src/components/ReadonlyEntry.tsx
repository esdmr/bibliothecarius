import {useId} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Card from 'react-bootstrap/esm/Card.js';
import CardBody from 'react-bootstrap/esm/CardBody.js';
import CardFooter from 'react-bootstrap/esm/CardFooter.js';
import CardHeader from 'react-bootstrap/esm/CardHeader.js';
import Form from 'react-bootstrap/esm/Form.js';
import type {Signal} from '@preact/signals';
import type {Route} from '../backend.js';
import {useRefSignalRecord} from '../signal-record.js';
import {useForceUpdate} from '../force-update.js';
import {EntryFields} from './EntryFields.js';
import {usePages} from './MainMenu.js';
import {EditingEntry} from './EditingEntry.js';

export const ReadonlyEntry = ({
    data,
    route,
    nullable,
    onRemove,
    disabled,
}: {
    data: Record<string, any>;
    route: Route;
    nullable?: boolean;
    onRemove?: () => void;
    disabled?: boolean | 'only-children' | Signal<boolean>;
}) => {
    const formId = useId();
    const inputs = useRefSignalRecord(data, route);
    const pages = usePages();
    const forceUpdate = useForceUpdate();

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
                        disabled={true}
                    />
                </Form>
            </CardBody>
            <CardFooter hidden={disabled as never}>
                <Button
                    variant="primary"
                    type="button"
                    onClick={async () => {
                        await pages.open(
                            <EditingEntry data={data} route={route} />,
                        );
                        forceUpdate();
                    }}
                >
                    Edit
                </Button>
                {nullable && (
                    <Button
                        variant="danger"
                        type="button"
                        key="remove"
                        onClick={() => {
                            onRemove?.();
                        }}
                    >
                        Remove
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};
