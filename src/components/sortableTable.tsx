import * as React from "react";
import {CSSProperties, ReactElement, useState} from "react";

import './sortableTable.css';
import innerText from "react-innertext";

type ColumnConfig<TItem = object> = {
    title: string | ReactElement,
    value: (item: TItem) => string | ReactElement,
    cmp?: (a: TItem, b: TItem) => number,
    classList?: string | string[] | ((item: TItem) => string[]),
    style?: CSSProperties | ((item: TItem) => CSSProperties),
}

interface SortableTableProps<TItem = object> {
    columns: ColumnConfig<TItem>[],
    data: TItem[],
}

export default function SortableTable<TItem = object>(props: SortableTableProps<TItem>) {
    /* Displays items in a sortable table.
     * `data` is an array of objects, one for each row to display
     * `columns` is an array of columns to extract from each item to display:
     *   it's an object containing:
     *     - title: Text to put in the column header
     *     - value: f(item): value to put in this column
     *     - cmp(a, b): compare function to compare entire objects for sorting this column
     *                  default: a[key] <=> b[key]
     *     - classList: string, string[] or f(item): string[]
     *     - style: object or f(item): object
     */
    const [sortColumnNr, setSortColumnNr] = useState(null);
    const [sortDir, setSortDir] = useState(1);

    const columns = [];
    for(let column of props.columns || []) {
        if(!('cmp' in column)) {
            const valueF = column.value;
            column.cmp = (a, b) => {
                let aVal = valueF(a);
                if(React.isValidElement(aVal)) {
                    aVal = innerText(aVal);
                }
                let bVal = valueF(b);
                if(React.isValidElement(bVal)) {
                    bVal = innerText(bVal);
                }
                if(aVal === bVal) return 0;
                if(aVal < bVal) return -1;
                if(aVal > bVal) return 1;
                console.error("Can't compare:", a, b);
                return 0;
            }
        }

        if(!('classList'in column)) column.classList = [];
        if(typeof column.classList === 'string') column.classList = [column.classList];

        if(!('style' in column)) column.style = {};

        columns.push(column);
    }

    const columnHeaders = [];
    for(let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const sortStyle = sortColumnNr === i ? (sortDir > 0 ? "sort asc" : "sort desc") : "";
        columnHeaders.push(
            <th key={i}
                onClick={() => {
                    if(sortColumnNr === i) {
                        setSortDir(-sortDir);
                    } else {
                        setSortColumnNr(i);
                        setSortDir(1);
                    }
                }}
                className={sortStyle}
            >{column.title}
            </th>
        );
    }

    const rows = [];
    const dataSortedIndices = [...Array((props.data || []).length).keys()].sort((a, b) => {
        if(sortColumnNr === null) {
            return (a - b);
        }
        return columns[sortColumnNr].cmp(props.data[a], props.data[b]) * sortDir;
    });
    for(let i of dataSortedIndices) {
        const item = props.data[i];
        const td = [];
        for(let j = 0; j < columns.length; j++) {
            const column = columns[j];
            let classList = column.classList;
            if(typeof classList === 'function') classList = classList(item);

            let style = column.style;
            if(typeof style === 'function') style = style(item);

            td.push(<td key={j} className={classList.join(' ')}
                        style={style}>{column.value(item)}</td>
            );
        }
        rows.push(<tr key={i}>{td}</tr>);
    }

    return <table className="sortableTable">
        <thead><tr>{columnHeaders}</tr></thead>
        <tbody>{rows}</tbody>
    </table>;
}