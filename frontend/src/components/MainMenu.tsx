import {signal, useComputed, useSignal, type Signal} from '@preact/signals';
import {createContext, type VNode} from 'preact';
import {useContext} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Col from 'react-bootstrap/esm/Col.js';
import {routes} from '../backend.js';
import {accountSelected, isAdmin, setToken, username} from '../token.js';
import {EntryList} from './EntryList.js';

type Pages = Signal<
    Array<{
        vnode: VNode;
        onClose?: (data: any) => void;
    }>
>;

export const pagesContext = createContext<Pages | undefined>(undefined);

export const usePages = (pages = useContext(pagesContext)) => {
    if (!pages) {
        throw new Error('Outside of a page');
    }

    return {
        pages,
        async open(vnode: VNode) {
            return new Promise((resolve) => {
                pages.value = [...pages.value, {vnode, onClose: resolve}];
            });
        },
        close(data: any) {
            const last = pages.value.at(-1);
            last?.onClose?.(data);
            pages.value = pages.value.slice(0, -1);
        },
    };
};

export const MainMenu = () => {
    const pages: Pages = useSignal([
        {
            vnode: (
                <>
                    <Col>
                        <span>Hello, {username}!</span>
                        <Button
                            variant="outline-danger"
                            onClick={() => {
                                setToken('');
                                accountSelected.value = false;
                            }}
                        >
                            Log out
                        </Button>
                    </Col>
                    <Col>
                        {routes.map((i) => (
                            <Button
                                key={i.plural}
                                hidden={useComputed(() =>
                                    i.adminOnly ? !isAdmin.value : undefined,
                                )}
                                onClick={async () => {
                                    await usePages(pages).open(
                                        <EntryList
                                            input={signal(undefined)}
                                            route={i}
                                            mode="view"
                                        />,
                                    );
                                }}
                            >
                                {i.plural}
                            </Button>
                        ))}
                    </Col>
                </>
            ),
        },
    ]);

    return (
        <pagesContext.Provider value={pages}>
            {useComputed(() =>
                pages.value.map(({vnode}, index, {length}) => (
                    <div key={index} hidden={index < length - 1}>
                        <Col>
                            {index > 0 && (
                                <Button
                                    key="close"
                                    variant="outline-dark"
                                    onClick={() => {
                                        usePages(pages).close(undefined);
                                        accountSelected.value = false;
                                    }}
                                >
                                    Back
                                </Button>
                            )}
                        </Col>
                        <Col>{vnode}</Col>
                    </div>
                )),
            )}
        </pagesContext.Provider>
    );
};
