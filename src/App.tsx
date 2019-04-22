import * as React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import routes from "./routes";

class App extends React.Component {
    public render() {
        return (
            <Router>
                <div className="App">
                    {routes.map(route => {
                        const { path, exact, component } = route;
                        return <Route key={path} path={path} exact={exact} component={component} />;
                    })}
                </div>
            </Router>
        );
    }
}

export default App;
