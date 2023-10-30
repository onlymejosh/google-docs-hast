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
  const { tableRows } = table;

  const el = h("table");

  // Loop through rows
  // If row contains rowspan log row,index of cell and rowspan
  // for next rowspanConut -1 delete the cell at cellIndex
  for (const row of tableRows) {
    const tr = h("tr");
    for (const cell of row.tableCells) {
      const td = h("td", transform(cell.content, context));
      styleTableCell(td, cell.tableCellStyle);
      tr.children.push(td);
    }
    el.children.push(tr);
  }

  let rowSpanCount = 0;
  let cellIndex = 0;

  for (const row of el.children) {
    if (rowSpanCount) {
      el.children.splice(cellIndex, 1);
      rowSpanCount--;
      continue;
    }

    cellIndex = row.children.findIndex((td) => td.properties.rowSpan > 1);
    if (cellIndex) {
      const td = row.children[rowSpanIndex];
      rowSpanCount = td.properties.rowSpan - 1;
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
  }: docs_v1.Schema$TableCellStyle
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
};
