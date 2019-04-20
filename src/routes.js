import { Home } from './modules/Home';
import { AuthPage } from './modules/AuthPage';

export default [
    {
        path: '/',
        component: Home,
        exact: true,
    },
    {
        path: '/auth',
        component: AuthPage,
    },
];
