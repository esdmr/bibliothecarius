import {useComputed} from '@preact/signals';
import {accountSelected, isFresh} from '../token.js';
import {ChallengeForm} from './ChallengeForm.js';
import {LogInForm} from './LogInForm.js';
import {MainMenu} from './MainMenu.js';

export const App = () => {
    return (
        <>
            {useComputed(() =>
                !isFresh.value && !accountSelected.value ? (
                    <LogInForm
                        key="login"
                        onLoggedIn={() => {
                            accountSelected.value = true;
                        }}
                    />
                ) : isFresh.value ? undefined : (
                    <ChallengeForm key="challenge" />
                ),
            )}
            <div hidden={useComputed(() => !isFresh.value)}>
                <MainMenu />
            </div>
        </>
    );
};
