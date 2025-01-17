import * as React from "react";

export type activeRecipes = {
    lfox: boolean,
    lf: boolean,
    ox: boolean,
    mono: boolean,
}

export interface ConvertOTronRecipesProps {
    trons: Array<activeRecipes>
    onChange: (trons: Array<activeRecipes>) => void
}

export function ConvertOTronRecipes(props: ConvertOTronRecipesProps) {
    const addTron = () => {
        props.onChange([...props.trons, {lfox: false, lf: false, ox: false, mono: false}]);
    }

    const removeTron = (tronNr: number) => {
        const trons = props.trons.slice();  // create copy to keep original immutable
        trons.splice(tronNr, 1);
        props.onChange(trons);
    }

    const switchRecipe = (tronNr: number, rcp: keyof activeRecipes, value: boolean) => {
        const trons = props.trons.slice();  // create copy
        trons[tronNr] = {...trons[tronNr]};
        trons[tronNr][rcp] = value;
        props.onChange(trons);
    }

    const convertOTrons = [];
    for (const [tronNr, tron] of props.trons.entries()) {
        convertOTrons.push(<div key={tronNr}>
            <label key="lfox"><input type="checkbox" checked={tron.lfox}
                                     onChange={(e) => switchRecipe(tronNr, 'lfox', e.target.checked)}
            />Lf+Ox</label>
            <label key="mono"><input type="checkbox" checked={tron.mono}
                                     onChange={(e) => switchRecipe(tronNr, 'mono', e.target.checked)}
            />Mono</label>
            <label key="lf"><input type="checkbox" checked={tron.lf}
                                   onChange={(e) => switchRecipe(tronNr, 'lf', e.target.checked)}
            />Lf</label>
            <label key="ox"><input type="checkbox" checked={tron.ox}
                                   onChange={(e) => switchRecipe(tronNr, 'ox', e.target.checked)}
            />Ox</label>
            <input type="button" value="-" onClick={() => removeTron(tronNr)}/>
            <br/>
        </div>);
    }

    return <div>
        {convertOTrons}
        <input type="button" value="+"
               onClick={() => addTron()}
        />
    </div>
}