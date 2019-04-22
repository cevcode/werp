import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import commonStore from './stores/commonStore';
import authStore from './stores/authStore';

const superagent = superagentPromise(_superagent, global.Promise);

const METHOD_NAME = 'InvokeNoSession';
const METADATA_URL = '/';
const BASE_URL = `${METADATA_URL}/${METHOD_NAME}`;

const encode = encodeURIComponent;

const handleErrors = err => {
    if (err && err.response && err.response.status === 401) {
        authStore.logout();
    }
    return err;
};

const responseBody = res => res.body;

const tokenPlugin = req => {
    if (commonStore.token) {
        req.set('authorization', `Token ${commonStore.token}`);
    }
};

const requests = {
    del: database =>
        superagent
            .del(`${BASE_URL}?db=${database}`)
            .use(tokenPlugin)
            .end(handleErrors)
            .then(responseBody),
    get: database =>
        superagent
            .get(`${BASE_URL}?db=${database}`)
            .use(tokenPlugin)
            .end(handleErrors)
            .then(responseBody),
    put: (database, body) =>
        superagent
            .put(`${BASE_URL}?db=${database}`, body)
            .use(tokenPlugin)
            .end(handleErrors)
            .then(responseBody),
    post: (database, body) =>
        superagent
            .post(`${BASE_URL}?db=${database}`, body)
            .use(tokenPlugin)
            .end(handleErrors)
            .then(responseBody),
};

const Auth = {
    current: database => requests.get(database),
    login: (username, password, database) => requests.post(database, { user: { username, password } }),
    register: (username, email, password, database) => requests.post(database, { user: { username, email, password } }),
    save: (user, database) => requests.put(database, { user }),
};

const limit = (count, p) => `limit=${count}&offset=${p ? p * count : 0}`;
const omitSlug = article => Object.assign({}, article, { slug: undefined });

export default {
    Auth,
};
