import {useSignal} from '@preact/signals';
import {useRef} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Col from 'react-bootstrap/esm/Col.js';
import Form from 'react-bootstrap/esm/Form.js';
import FormControl from 'react-bootstrap/esm/FormControl.js';
import FormLabel from 'react-bootstrap/esm/FormLabel.js';
import type {components} from '../api.js';
import {useAsyncEffect} from '../async-effect.js';
import {getUrl} from '../backend.js';
import {authorization, setToken} from '../token.js';

export const ChallengeForm = ({onResponded}: {onResponded?: () => void}) => {
    const hash = useSignal('');
    const image = useSignal('');
    const text = useRef<HTMLInputElement>(null);
    const count = useSignal(0);
    const isLoading = useSignal(true);
    const isSubmitting = useSignal(false);

    useAsyncEffect(async () => {
        const response = await fetch(getUrl('/challenge/'), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authorization.value,
            },
            body: JSON.stringify(
                {} as components['schemas']['ChallengeResponseMessage'],
            ),
        });

        if (!response.ok) {
            throw new Error('Failed to request captcha', {
                cause: await response.text(),
            });
        }

        const json =
            (await response.json()) as components['schemas']['ChallengeRequestMessage'];

        hash.value = json.request!.hash;
        image.value = json.request!.image;
        isLoading.value = false;
    }, [count.value]);

    return (
        <Form
            onSubmit={async (event: Event) => {
                event.preventDefault();
                isSubmitting.value = true;

                try {
                    const response = await fetch(getUrl('/challenge/'), {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: authorization.value,
                        },
                        body: JSON.stringify({
                            response: {
                                hash: hash.value,
                                text: text.current?.value ?? '',
                            },
                        } as components['schemas']['ChallengeResponseMessage']),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to verify captcha', {
                            cause: await response.text(),
                        });
                    }

                    const json =
                        (await response.json()) as components['schemas']['ChallengeRequestMessage'];

                    setToken(json.token!);

                    image.value = '';
                    onResponded?.();
                } finally {
                    isSubmitting.value = false;
                }
            }}
        >
            <Col>
                <h2>Challenge</h2>
                <img src={image}></img>
                <Col>
                    <FormLabel for="text">Text</FormLabel>
                    <FormControl ref={text} id="text" autoFocus />
                </Col>
                <Col>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting as never}
                    >
                        OK
                    </Button>
                </Col>
                <Col>
                    <Button
                        variant="secondary"
                        type="button"
                        disabled={isLoading as never}
                        onClick={() => {
                            isLoading.value = true;

                            setTimeout(
                                () => {
                                    count.value++;
                                },
                                count.value ** 2 * 100,
                            );
                        }}
                    >
                        Refresh
                    </Button>
                </Col>
            </Col>
        </Form>
    );
};
