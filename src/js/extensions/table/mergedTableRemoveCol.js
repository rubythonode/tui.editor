/**
 * @fileoverview Implements mergedTableRemoveCol
 * @author Jiung Kang(jiung.kang@nhnent.com) FE Development Lab/NHN Ent.
 */

import CommandManager from '../../commandManager';
import dataHandler from './tableDataHandler';
import tableRangeHandler from './tableRangeHandler';
import tableRenderer from './tableRenderer';

const {util} = tui;

/**
 * RemoveCol
 * Remove col to selected table
 * @exports RemoveCol
 * @augments Command
 * @augments WysiwygCommand
 * @ignore
 */
const RemoveCol = CommandManager.command('wysiwyg', /** @lends RemoveCol */{
    name: 'RemoveCol',
    /**
     * Command handler.
     * @param {WysiwygEditor} wwe - WYsiwygEditor instance
     */
    exec(wwe) {
        const sq = wwe.getEditor();
        const range = sq.getSelection().cloneRange();

        wwe.focus();

        if (!sq.hasFormat('TABLE')) {
            return;
        }

        const $startContainer = $(range.startContainer);
        const $table = $startContainer.closest('table');
        const tableData = dataHandler.createTableData($table);
        const $selectedCells = wwe.componentManager.getManager('tableSelection').getSelectedCells();
        const tableRange = tableRangeHandler.getTableSelectionRange(tableData, $selectedCells, $startContainer);
        const beforeCellLength = tableData[0].length;

        _removeColumns(tableData, tableRange);

        if (beforeCellLength === tableData[0].length) {
            return;
        }

        const $newTable = tableRenderer.replaceTable($table, tableData);
        const focusCell = _findFocusCell($newTable, tableRange.start.rowIndex, tableRange.end.colIndex);

        tableRenderer.focusToCell(sq, range, focusCell);
    }
});

/**
 * Update colspan to col merger.
 * @param {Array.<Array.<object>>} tableData - table data
 * @param {number} startColIndex - start col index
 * @param {number} endColIndex - end col index
 * @private
 */
function _updateColspan(tableData, startColIndex, endColIndex) {
    tableData.forEach(rowData => {
        util.range(startColIndex, endColIndex + 1).forEach(colIndex => {
            const cellData = rowData [colIndex];

            if (util.isExisty(cellData.colMergeWith)) {
                const merger = rowData [cellData.colMergeWith];

                if (merger.colspan) {
                    merger.colspan -= 1;
                }
            } else if (cellData.colspan > 1) {
                const lastMergedCellIndex = colIndex + cellData.colspan - 1;

                cellData.colspan -= (endColIndex - colIndex + 1);

                if (lastMergedCellIndex > endColIndex) {
                    rowData [endColIndex + 1] = util.extend({}, cellData);
                }
            }
        });
    });
}

/**
 * Update row merge start index to merged cell.
 * @param {Array.<Array.<object>>} tableData - table data
 * @param {number} startColIndex - start col index
 * @param {number} endColIndex - end col index
 * @private
 */
function _updateMergeStartIndex(tableData, startColIndex, endColIndex) {
    tableData.forEach(rowData => {
        rowData.slice(endColIndex + 1).forEach(cellData => {
            if (util.isExisty(cellData.colMergeWith) && cellData.colMergeWith >= startColIndex) {
                cellData.colMergeWith = endColIndex + 1;
            }
        });
    });
}

/**
 * Remove columns.
 * @param {Array.<Array.<object>>} tableData - table data
 * @param {{
 *   start: {rowIndex: number, colIndex: number},
 *   end: {rowIndex: number, colIndex: number}
 * }} tableRange - table selection range
 * @private
 */
export function _removeColumns(tableData, tableRange) {
    const startColIndex = tableRange.start.colIndex;
    const endRange = tableRange.end;
    const endColIndex = dataHandler.findColMergedLastIndex(tableData, endRange.rowIndex, endRange.colIndex);
    const removeCount = endColIndex - startColIndex + 1;

    if (removeCount === tableData[0].length) {
        return;
    }

    _updateColspan(tableData, startColIndex, endColIndex);
    _updateMergeStartIndex(tableData, startColIndex, endColIndex);

    tableData.forEach(row => {
        row.splice(startColIndex, removeCount);
    });
}

/**
 * Find focus cell element like td or th.
 * @param {jQuery} $newTable - changed table jQuery element
 * @param {number} rowIndex - row index of table data
 * @param {number} colIndex - column index of tabld data
 * @returns {HTMLElement}
 * @private
 */
function _findFocusCell($newTable, rowIndex, colIndex) {
    const tableData = dataHandler.createTableData($newTable);

    if (tableData[0].length - 1 < colIndex) {
        colIndex -= 1;
    }

    const cellElementIndex = dataHandler.findElementIndex(tableData, rowIndex, colIndex);

    return $newTable.find('tr').eq(cellElementIndex.rowIndex).find('td, th')[cellElementIndex.colIndex];
}

export default RemoveCol;

