import {useSignal} from '@preact/signals';
import {useRef} from 'preact/hooks';
import Button from 'react-bootstrap/esm/Button.js';
import Col from 'react-bootstrap/esm/Col.js';
import FormControl from 'react-bootstrap/esm/FormControl.js';
import FormLabel from 'react-bootstrap/esm/FormLabel.js';
import type {components} from '../api.js';
import {getUrl} from '../backend.js';
import {setToken} from '../token.js';

export const LogInForm = ({onLoggedIn}: {onLoggedIn?: () => void}) => {
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const isSubmitting = useSignal(false);

    return (
        <form
            onSubmit={async (event) => {
                event.preventDefault();
                isSubmitting.value = true;

                try {
                    const response = await fetch(getUrl('/account/'), {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: username.current?.value ?? '',
                            password: password.current?.value ?? '',
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to authenticate', {
                            cause: await response.text(),
                        });
                    }

                    const json =
                        (await response.json()) as components['schemas']['Jwt'];

                    setToken(json.token);
                    onLoggedIn?.();
                } finally {
                    isSubmitting.value = false;
                }
            }}
        >
            <Col>
                <h2>Login</h2>
                <Col>
                    <FormLabel for="username">username</FormLabel>
                    <FormControl ref={username} id="username" autoFocus />
                </Col>
                <Col>
                    <FormLabel for="password">password</FormLabel>
                    <FormControl ref={password} type="password" id="password" />
                </Col>
                <Col>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting as never}
                    >
                        Login
                    </Button>
                </Col>
                <Col>
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                            isSubmitting.value = true;
                            setToken('');
                            onLoggedIn?.();
                        }}
                    >
                        Continue as Guest
                    </Button>
                </Col>
            </Col>
        </form>
    );
};
