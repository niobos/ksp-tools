import * as React from "react";

export class ConvertOTronRecipes extends React.PureComponent {
    addTron() {
        const trons = this.props.trons.slice();  // create copy to keep original immutable
        trons.push({lfox: false, lf: false, ox: false, mono: false})
        this.props.onChange(trons);
    }

    removeTron(tronNr) {
        const trons = this.props.trons.slice();  // create copy to keep original immutable
        trons.splice(tronNr, 1);
        this.props.onChange(trons);
    }

    switchRecipe(tronNr, rcp, value) {
        const trons = this.props.trons.slice();  // create copy
        const tron = {};
        Object.assign(tron, trons[tronNr]);  // copy
        trons[tronNr] = tron;
        trons[tronNr][rcp] = value;
        this.props.onChange(trons);
    }

    render() {
        const convertOTrons = [];
        for (let tronNr in this.props.trons) {
            const tron = this.props.trons[tronNr];
            convertOTrons.push(<div key={tronNr}>
                <label key="lfox"><input type="checkbox" checked={tron.lfox}
                                         onChange={(e) => this.switchRecipe(tronNr, 'lfox', e.target.checked)}
                />Lf+Ox</label>
                <label key="mono"><input type="checkbox" checked={tron.mono}
                                         onChange={(e) => this.switchRecipe(tronNr, 'mono', e.target.checked)}
                />Mono</label>
                <label key="lf"><input type="checkbox" checked={tron.lf}
                                       onChange={(e) => this.switchRecipe(tronNr, 'lf', e.target.checked)}
                />Lf</label>
                <label key="ox"><input type="checkbox" checked={tron.ox}
                                       onChange={(e) => this.switchRecipe(tronNr, 'ox', e.target.checked)}
                />Ox</label>
                <input type="button" value="-" onClick={() => this.removeTron(tronNr)}/>
                <br/>
            </div>);
        }

        return <div>
            {convertOTrons}
            <input type="button" value="+"
                   onClick={() => this.addTron()}
            />
        </div>
    }
}