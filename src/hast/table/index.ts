/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { h } from "hastscript";

import { transform } from "..";
import { borders, rgbColor, serializeStyle } from "../common/style";

import type { Context } from "..";
import type { docs_v1 } from "@googleapis/docs";
import type { Element } from "hast";

export const tableToElement = (
  table: docs_v1.Schema$Table,
  context: Context
): Element => {
  const { tableRows, tableStyle } = table;

  const el = h("table");

  // Loop through rows
  // If row contains rowspan log row,index of cell and rowspan
  // for next rowspanConut -1 delete the cell at cellIndex
  for (const [i, row] of tableRows.entries()) {
    let headerWidths;
    // Style header rows
    if (i === 0) {
      const totalHeader = tableStyle.tableColumnProperties.reduce(
        (acc, val) => (acc += val.width.magnitude),
        0
      );

      headerWidths = tableStyle.tableColumnProperties.map(
        ({ width: { magnitude } }) => (magnitude / totalHeader) * 100
      );
    }

    const tr = h("tr");
    for (const [cellIndex, cell] of row.tableCells.entries()) {
      const td = h("td", transform(cell.content, context));
      styleTableCell(
        td,
        cell.tableCellStyle,
        i === 0 ? headerWidths[cellIndex] : null
      );
      tr.children.push(td);
    }
    el.children.push(tr);
  }

  let rowSpanCount = 0;
  // const cellIndex = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (el as any).children as any) {
    if (rowSpanCount) {
      row.children.splice(0, 1);
      rowSpanCount--;
      continue;
    }

    const cellWithRowSpanIndex = row.children.findIndex(
      (td) => td.properties.rowSpan > 1
    );
    if (cellWithRowSpanIndex > -1) {
      const td = row.children[cellWithRowSpanIndex];
      rowSpanCount = td.properties.rowSpan - 1;
      // cellIndex = cellWithRowSpanIndex;
    }
  }

  return el;
};

export const styleTableCell = (
  el: Element,
  {
    backgroundColor,
    borderBottom,
    borderLeft,
    borderRight,
    borderTop,
    contentAlignment,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    rowSpan,
    columnSpan,
  }: docs_v1.Schema$TableCellStyle,
  columnWidth: number
) => {
  const style: { [key: string]: string } = {};

  if (backgroundColor && backgroundColor.color) {
    style.backgroundColor = rgbColor(backgroundColor);
  }

  Object.assign(
    style,
    borders({ borderBottom, borderLeft, borderRight, borderTop })
  );

  if (rowSpan) {
    el.properties.rowSpan = rowSpan;
  }
  if (columnSpan) {
    el.properties.colSpan = columnSpan;
  }

  if (paddingBottom) {
    style.paddingBottom = `${paddingBottom.magnitude}${paddingBottom.unit}`;
  }

  if (paddingLeft) {
    style.paddingLeft = `${paddingLeft.magnitude}${paddingLeft.unit}`;
  }

  if (paddingBottom) {
    style.paddingRight = `${paddingRight.magnitude}${paddingRight.unit}`;
  }

  if (paddingBottom) {
    style.paddingTop = `${paddingTop.magnitude}${paddingTop.unit}`;
  }

  if (contentAlignment) {
    style.verticalAlign = contentAlignment.toLowerCase();
  }

  if (Object.keys(style).length > 0) {
    el.properties.style = serializeStyle(style);
  }

  if (columnWidth) {
    style.width = `${columnWidth}%`;
  }
};
