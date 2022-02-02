import React from "react";  // JSX support
import ReactDOM from "react-dom";
import useFragmentState from "./utils/useFragmentState";
import Link from "./commnet/link";
import Endpoint, {calcCombinedPower} from "./commnet/endpoint";
import {arrayInsertElement, arrayRemoveElement, arrayReplaceElement} from "./components/list";

import './commnet.css';
import Antenna from "./utils/kspParts-antenna";

export default function App() {
    const [hops, setHops] = useFragmentState('h', [
        {a: ['pod built-in'], d: 100000},
        {a: ['KSC DSN Tier 3']},
    ])

    let totalSignalStrength = 1;
    const hopsJsx = [];
    for(let hopNr=0; hopNr < hops.length-1; hopNr++) {
        const hop = hops[hopNr];
        const powerA = calcCombinedPower(hop.a);
        const powerB = calcCombinedPower(hops[hopNr+1].a);
        const signalStrength = Antenna.signalStrength(powerA, powerB, hop.d);
        totalSignalStrength *= signalStrength;

        const removeButton = <input
            type="button" value="remove above hop"
            onClick={e => setHops(arrayRemoveElement(hops, hopNr))}
        />;
        hopsJsx.push(<div key={hopNr} className="hop">
            <Endpoint value={hop.a}
                      onChange={v => setHops(arrayReplaceElement(hops, hopNr, Object.assign({}, hop, {a: v})))}
            />
            <Link value={hop.d}
                  powerA={powerA} powerB={powerB}
                  onChange={v => setHops(arrayReplaceElement(hops, hopNr, Object.assign({}, hop, {d: v})))}
            />
            {hopNr > 0 ? removeButton : ""}
            <input type="button" value="add hop"
                   onClick={e => setHops(arrayInsertElement(hops, {a: ['HG-5'], d: 12000000}, hopNr+1))}/>
        </div>)
    }

    return <div>
        <h1>CommNet calculator</h1>
        {hopsJsx}
        <Endpoint value={hops[hops.length-1].a}
                  onChange={v => setHops(arrayReplaceElement(hops, hops.length-1, v))}
                  showGroundstations={true}
        />
        <div className="total">Total signal quality {(totalSignalStrength*100).toFixed(0)}%</div>
    </div>;
};

if(typeof window === 'object') { // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'));
    };
}