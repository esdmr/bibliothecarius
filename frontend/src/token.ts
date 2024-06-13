import {signal, computed} from '@preact/signals';
import {jwtDecode} from 'jwt-decode';
import type {components} from './api.js';

function now() {
    return Date.now() / 1000;
}

type JwtPayload = {
    fresh?: number;
    exp: number;
    sub: {
        account?: Omit<components['schemas']['Librarian'], 'password'>;
    };
};

export const currentToken = signal(localStorage.getItem('token') ?? '');

export const authorization = computed(() =>
    currentToken.value ? 'Bearer ' + currentToken.value : (undefined as never),
);

const decoded = computed(() =>
    currentToken.value ? jwtDecode<JwtPayload>(currentToken.value) : undefined,
);

export const isLoggedIn = computed(() =>
    Boolean(decoded.value?.sub.account?.username && decoded.value.exp > now()),
);

export const isAdmin = computed(() =>
    Boolean(decoded.value?.sub.account?.admin),
);

export const isFresh = computed(() =>
    Boolean((decoded.value?.fresh ?? 0) > now()),
);

export const username = computed(
    () => decoded.value?.sub.account?.username ?? 'guest user',
);

export const accountSelected = signal(isLoggedIn.value);

let timeout: string | number | NodeJS.Timeout | undefined;

setToken(currentToken.value);

export function setToken(token: string) {
    localStorage.setItem('token', token);
    currentToken.value = token;

    if (timeout !== undefined) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(
        () => {
            if (decoded.value?.exp && decoded.value.exp <= now()) {
                currentToken.value = '';
                localStorage.setItem('token', '');
            } else if (decoded.value?.fresh && decoded.value.fresh <= now()) {
                const oldValue = currentToken.value;
                currentToken.value = '';

                queueMicrotask(() => {
                    currentToken.value = oldValue;
                });
            }
        },
        (decoded.value?.fresh ?? decoded.value?.exp ?? 0) * 1000 -
            Date.now() +
            1,
    );

    if (import.meta.env.DEV) {
        console.debug({
            currentToken: currentToken.value,
            decoded: decoded.value,
            isLoggedIn: isLoggedIn.value,
            isAdmin: isAdmin.value,
            isFresh: isFresh.value,
        });
    }
}
