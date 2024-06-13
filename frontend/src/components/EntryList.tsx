import {useSignal, type Signal, useComputed, batch} from '@preact/signals';
import Card from 'react-bootstrap/esm/Card.js';
import CardBody from 'react-bootstrap/esm/CardBody.js';
import CardHeader from 'react-bootstrap/esm/CardHeader.js';
import CardFooter from 'react-bootstrap/esm/CardFooter.js';
import {Button, FormControl} from 'react-bootstrap';
import {backend, type Route} from '../backend.js';
import {useAsyncEffect} from '../async-effect.js';
import {authorization} from '../token.js';
import {SelectingEntry} from './SelectingEntry.js';
import {ReadonlyEntry} from './ReadonlyEntry.js';
import {usePages} from './MainMenu.js';
import {InsertingEntry} from './InsertingEntry.js';

async function remove(data: Record<string, any>, route: Route) {
    const response = await fetch(
        new URL(`${route.url}${data[route.key]}`, backend),
        {
            method: 'delete',
            headers: {
                Authorization: authorization.value,
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to remove ${route.singular} ${data[route.key]}`,
            {
                cause: await response.text(),
            },
        );
    }
}

const itemsPerPage = 10;

export const EntryList = ({
    input,
    route,
    mode,
    disabled,
}: {
    input: Signal;
    route: Route;
    mode?: 'select' | 'view';
    disabled?: boolean | Signal<boolean>;
}) => {
    const entries = useSignal<Array<Record<string, any>>>([]);
    const targetPage = useSignal(0);

    const hasMultiplePages = useComputed(
        () => entries.value.length > itemsPerPage,
    );
    const effectivePage = useComputed(() =>
        Math.max(
            Math.min(
                targetPage.value,
                Math.ceil(entries.value.length / itemsPerPage) - 1,
            ),
            0,
        ),
    );
    const filteredEntries = useComputed(() =>
        entries.value
            .map((v, k) => [k, v] as const)
            .filter(([, v]) =>
                Object.values(v).some((i) =>
                    String(i)
                        .toLowerCase()
                        .includes(searchString.value.toLowerCase()),
                ),
            ),
    );
    const currentPage = useComputed(() =>
        filteredEntries.value.slice(
            effectivePage.value * itemsPerPage,
            (effectivePage.value + 1) * itemsPerPage,
        ),
    );
    const searchString = useSignal('');

    useAsyncEffect(async () => {
        const response = await fetch(new URL(route.url, backend), {
            method: 'get',
            headers: {
                Authorization: authorization.value,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${route.plural}`, {
                cause: await response.text(),
            });
        }

        entries.value = await response.json();
        targetPage.value = 0;
    }, [route.url]);

    const EntryView = mode === 'view' ? ReadonlyEntry : SelectingEntry;
    const pages = usePages();

    return (
        <Card>
            <CardHeader>{route.plural}</CardHeader>
            <CardBody>
                <FormControl
                    type="search"
                    value={searchString as never}
                    onInput={(event: InputEvent) => {
                        searchString.value = (
                            event.currentTarget as HTMLInputElement
                        ).value;
                    }}
                />
                {useComputed(() =>
                    entries.value.length === 0 ? (
                        <span>Nothing here….</span>
                    ) : (
                        currentPage.value.map(([index, data]) => (
                            <EntryView
                                input={input}
                                data={data}
                                route={route}
                                key={data[route.key]}
                                nullable
                                onRemove={async () => {
                                    await remove(data, route);
                                    entries.value = [
                                        ...entries.value.slice(0, index),
                                        ...entries.value.slice(index + 1),
                                    ];
                                    targetPage.value = Number.POSITIVE_INFINITY;
                                }}
                            />
                        ))
                    ),
                )}
            </CardBody>
            <CardFooter hidden={disabled}>
                <Button
                    variant="primary"
                    type="button"
                    onClick={async () => {
                        const value = await pages.open(
                            <InsertingEntry route={route} />,
                        );

                        batch(() => {
                            input.value = value;
                            entries.value = [...entries.value, value as any];
                            targetPage.value = Number.POSITIVE_INFINITY;
                        });
                    }}
                >
                    New
                </Button>
                <div hidden={useComputed(() => !hasMultiplePages.value)}>
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                            targetPage.value--;
                        }}
                    >
                        Previous
                    </Button>
                    {useComputed(() => effectivePage.value + 1)}
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                            targetPage.value++;
                        }}
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};
