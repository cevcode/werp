import { Home } from './modules/Home';
import { Auth } from './modules/Auth';

export default [
    {
        path: '/',
        component: Home,
        exact: true,
    },
    {
        path: '/auth',
        component: Auth,
    },
];
