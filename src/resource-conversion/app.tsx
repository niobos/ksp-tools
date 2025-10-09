import ReactDOM from "react-dom"
import * as React from "react"
import {useState} from "react"
import KspModSelector from "../components/kspModSelector";
import useMultiState from "../utils/useMultiState";
import useFragmentState from "useFragmentState";
import useLocalStorageState from "useLocalStorageState";
import {resourceInfoWithMods, Resources} from "../utils/kspParts";
import {formatValueRate, KerbalYdhmsInput, RateInput} from "../components/formattedInput";
import {formatValueSi, PercentInput, SiInput} from "formattedInput";
import './app.css'
import {conversionRecipesWithMods} from "../utils/kspParts-converters";

interface ResourceTableProps {
    resourceRate: Resources
    resourceFactor?: number
    runTime: number
    scaleRate?: (factor: number) => void
    setRunTime?: (time: number) => void
    resourceInfo: ReturnType<typeof resourceInfoWithMods>
}
function ResourceTable(
    {
        resourceRate,
        resourceFactor = 1,
        runTime,
        scaleRate = null,
        setRunTime = null,
        resourceInfo,
    }: ResourceTableProps
) {
    const timeUnits: Array<[number, string]> = [[60, 'm'], [60, 'h'], [6, 'd'], [425, 'y']]

    const scaledResourceRate = resourceRate.scaled(resourceFactor)
    const massFlow = scaledResourceRate.mass(resourceInfo)
    const consJsx = []

    const rateInputOrNumber = (rate: number, unit: string = '', baseRate: number = null) => {
        if(baseRate == null) baseRate = rate
        if(scaleRate != null) {
            return <RateInput
                style={{width: "5em", textAlign: "right"}}
                unit={unit}
                timeUnits={timeUnits}
                value={rate}
                onChange={(value: number) => {
                    scaleRate(value / baseRate)
                }}
            />
        } else {
            return <>{formatValueRate(rate, unit, 's', timeUnits)}</>
        }
    }
    const siInputOrNumber = (rate: number) => {
        if(setRunTime != null) {
            return <SiInput
                style={{width: "5em", textAlign: "right"}}
                value={rate * runTime}
                onChange={(value: number) => {
                    setRunTime(value / rate)
                }}
            />
        } else {
            return <>{formatValueSi(rate * runTime)}</>
        }
    }

    for(let resourceName in scaledResourceRate.amount) {
        consJsx.push(<tr key={resourceName}>
            <td>{resourceName}</td>
            <td>{rateInputOrNumber(scaledResourceRate.amount[resourceName])}</td>
            <td>{siInputOrNumber(scaledResourceRate.amount[resourceName])}</td>
            <td>{rateInputOrNumber(massFlow[resourceName], 't')}</td>
            <td>{siInputOrNumber(massFlow[resourceName])}t</td>
        </tr>)
    }


    const totalMasFlowRateCons = scaledResourceRate.selectiveMass(resourceInfo, (res, a) => a > 0)
    const totalMasFlowRateProd = scaledResourceRate.selectiveMass(resourceInfo, (res, a) => a < 0)
    consJsx.push(<tr key="totalC">
        <td>Total consumed</td>
        <td></td><td></td>
        <td style={{textAlign: 'right'}}>{formatValueRate(totalMasFlowRateCons, 't', 's', timeUnits)}</td>
        <td style={{textAlign: 'right'}}>{formatValueSi(totalMasFlowRateCons * runTime)}t</td>
    </tr>)
    consJsx.push(<tr key="totalP">
        <td>Total produced</td>
        <td/><td/>
        <td style={{textAlign: 'right'}}>{formatValueRate(totalMasFlowRateProd, 't', 's', timeUnits)}</td>
        <td style={{textAlign: 'right'}}>{formatValueSi(totalMasFlowRateProd * runTime)}t</td>
    </tr>)

    return <table className="resourceTable">
        <thead>
        <tr>
            <th rowSpan={2}>Resource</th>
            <th colSpan={2} style={{textAlign: 'center'}}>Units</th>
            <th colSpan={2} style={{textAlign: 'center'}}>Mass</th>
        </tr>
        <tr>
            {/* rowspan Resource */}
            <th>Rate</th><th>Total</th>
            <th>Rate</th><th>Total</th>
        </tr>
        </thead>
        <tbody>{consJsx}</tbody>
    </table>
}


function App() {
    const [activeMods, setActiveMods] = useMultiState<Set<string>>(
        [
            useFragmentState<Set<string>>("mod",
                s => {
                    if(s == null) return null
                    const v: Array<string> = JSON.parse(s)
                    return new Set(v)
                },
                o => JSON.stringify([...o]),
            ),
            useLocalStorageState<Set<string>>('ksp-active-mods',
                s => {
                    if(s == null) return null
                    const v: Array<string> = JSON.parse(s)
                    return new Set(v)
                },
                o => JSON.stringify([...o]),
            ),
        ],
        new Set(),
    )
    const kspRecipes = conversionRecipesWithMods(activeMods)
    const [activeRecipes, setActiveRecipes] = useFragmentState<Record<string, number>>('r',
        {[Object.keys(kspRecipes)[0]]: 1},
    )
    const [runTime, setRunTime] = useFragmentState<number>('t', 60)
    const [selectedRecipe, setSelectedRecipe] = useState<string>(Object.keys(kspRecipes)[0])

    const resourceInfo = resourceInfoWithMods(activeMods)

    let resourcesTotalConsumption = new Resources({})

    const activeRecipesJsx = []
    for(let recipeName in activeRecipes) {
        const recipe = kspRecipes[recipeName].consumption
        const scaledRecipe = recipe.scaled(activeRecipes[recipeName])
        resourcesTotalConsumption = resourcesTotalConsumption.add(scaledRecipe)

        activeRecipesJsx.push(<li key={recipeName}><div>
            <input type="button" value="Remove" onClick={ () => {
                const {[recipeName]: _, ...others} = activeRecipes
                setActiveRecipes(others)
            }}/>
            <PercentInput
                value={activeRecipes[recipeName]}
                style={{textAlign: 'right', width: "5em"}}
                onChange={v => setActiveRecipes(Object.assign({}, activeRecipes, {[recipeName]: v}))}
            />%× {recipeName}
            <p>{kspRecipes[recipeName].engineerComment}</p>
            <ResourceTable
                resourceRate={recipe} resourceFactor={activeRecipes[recipeName]}
                runTime={runTime}
                scaleRate={f => setActiveRecipes({...activeRecipes, [recipeName]: activeRecipes[recipeName] * f})}
                setRunTime={setRunTime}
                resourceInfo={resourceInfo}
            />
        </div></li>)
    }

    const recipeOptions = []
    const sortedRecipeNames = Object.keys(kspRecipes)
    sortedRecipeNames.sort()  // in-place sort
    for(let recipeName of sortedRecipeNames) {
        recipeOptions.push(<option key={recipeName}>{recipeName}</option>)
    }

    return <>
        <h1>Resource Conversion</h1>
        <KspModSelector value={activeMods}
                        onChange={setActiveMods}/>

        <p>Total run time: <KerbalYdhmsInput value={runTime} onChange={setRunTime}/></p>

        <ul>{activeRecipesJsx}</ul>

        <input type="button" value="Add recipe" onClick={
            () => {
                const current = activeRecipes[selectedRecipe] || 0
                setActiveRecipes(Object.assign({}, activeRecipes, {[selectedRecipe]: current + 1}))
            }}
        />
        <select name="recipe"
                value={selectedRecipe}
                onChange={e => setSelectedRecipe(e.currentTarget.value)}
        >{recipeOptions}</select>

        <h2>Total</h2>
        <ResourceTable
            resourceRate={resourcesTotalConsumption}
            runTime={runTime}
            setRunTime={setRunTime}
            resourceInfo={resourceInfo}
        />
    </>
}

if(typeof window === 'object') {   // @ts-ignore
    window.renderApp = function() {
        ReactDOM.render(React.createElement(App), document.querySelector('#reactapp'))
    }
}
