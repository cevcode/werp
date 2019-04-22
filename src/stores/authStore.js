import { observable, action } from 'mobx';
import agent from '../agent';
import userStore from './userStore';
import commonStore from './commonStore';

class AuthStore {
    @observable inProgress = false;
    @observable errors = undefined;

    @observable values = {
        username: '',
        email: '',
        password: '',
        database: '',
    };

    @action setUserData(username, password, database) {
        this.values.database = database;
        this.values.username = username;
        this.values.password = password;
    }

    @action setEmail(email) {
        this.values.email = email;
    }

    @action setPassword(password) {
        this.values.password = password;
    }

    @action reset() {
        this.values.username = '';
        this.values.email = '';
        this.values.password = '';
    }

    @action login() {
        this.inProgress = true;
        this.errors = undefined;
        const { database, username, password } = this.values;
        return agent.Auth.login(username, password, database)
            .then(({ user }) => commonStore.setToken(user.token))
            .then(() => userStore.pullUser())
            .catch(
                action(err => {
                    this.errors = err.response && err.response.body && err.response.body.errors;
                    throw err;
                })
            )
            .finally(
                action(() => {
                    this.inProgress = false;
                })
            );
    }

    @action register() {
        this.inProgress = true;
        this.errors = undefined;
        return agent.Auth.register(this.values.username, this.values.email, this.values.password)
            .then(({ user }) => commonStore.setToken(user.token))
            .then(() => userStore.pullUser())
            .catch(
                action(err => {
                    this.errors = err.response && err.response.body && err.response.body.errors;
                    throw err;
                })
            )
            .finally(
                action(() => {
                    this.inProgress = false;
                })
            );
    }

    @action logout() {
        commonStore.setToken(undefined);
        userStore.forgetUser();
        return Promise.resolve();
    }
}

export default new AuthStore();
