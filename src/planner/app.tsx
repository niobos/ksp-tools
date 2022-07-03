import * as React from "react";
import ReactDOM from 'react-dom';
import {bodies, planets} from "../utils/kspBody";

import './app.css';

function App() {
    const burns = ["TMI"];

    const segmentsJsx = [];
    let currentOrbit = "LKO"
    for(let burn of burns) {
        segmentsJsx.push(<li>{currentOrbit}: {burn}</li>);
        currentOrbit = burn;
    }
    segmentsJsx.push(<li>{currentOrbit}</li>)

    return <>
        <h1>Mission planner</h1>
        <div id="segments">
            <ol>{segmentsJsx}</ol>
        </div>
        <div id="details">

        </div>
    </>;
}

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function(selector) {
        ReactDOM.render(React.createElement(App), document.querySelector(selector));
    };
}