import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Paper from "@material-ui/core/Paper";
import type { Data } from "../App";

type Page = {
  title: string;
};

type Column = {
  id: string;
  label: string;
  align?: "left" | "right" | "justify" | "center";
};

type Order = "asc" | "desc";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }

  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

function getComparator<Key extends string>(
  order: Order,
  orderBy: Key
): (a: any, b: any) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}

const useStyles = makeStyles({
  root: {
    color: "red",
    "&:hover": {
      color: "blue",
    },
    "&$active": {
      color: "green",
    },
  },
  active: {},
  icon: {
    color: "inherit !important",
  },
});

type Row = {
  id: string;
  title: string;
} & Data[keyof Data];

const Pages = ({
  pages,
  data,
  removeTitle,
}: {
  pages: Page[];
  data?: Data;
  removeTitle: (title: string) => void;
}) => {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<string>("index");
  const styles = useStyles();

  const sort = (key: string) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const rows: Row[] = pages.map(({ title }) => ({
    id: title,
    title,
    ...(data?.[title] || { in: 0, out: 0, degree: 0 }),
  }));

  const columns: Column[] = [
    {
      id: "title",
      label: "Title",
      align: "left",
    },
    {
      id: "in",
      label: "In",
      align: "right",
    },
    {
      id: "out",
      label: "Out",
      align: "right",
    },
    {
      id: "degree",
      label: "Degree",
      align: "right",
    },
  ];

  return (
    <TableContainer
      component={Paper}
      style={{
        maxHeight: "40vh",
        boxShadow: "0px 5px 10px rgba(0,0,0,0.19), 2px 2px 5px rgba(0,0,0,0.20)",
        background: "var(--input-background)",
        // width: 275,
      }}
    >
      <Table stickyHeader style={{ color: "hsl(227, 18%, 70%)", width: "unset" }}>
        <TableHead>
          <TableRow>
            {columns.map((column, i) => (
              <TableCell
                key={column.id}
                align={column.align || "right"}
                size="small"
                style={{
                  borderBottom: rows.length === 0 ? "none" : "1.5px solid #5e9a9e",
                  padding: `6px ${i === columns.length - 1 ? 10 : 0}px 6px ${
                    i === 0 ? 10 : 0
                  }px`,
                  background: "var(--input-background)",
                  ...{
                    maxWidth: i !== 0 ? 80 : 100,
                  },
                }}
              >
                <TableSortLabel
                  active={orderBy === column.id}
                  direction={orderBy === column.id ? order : "asc"}
                  onClick={() => sort(column.id)}
                  classes={{
                    root: styles.root,
                    active: styles.active,
                    icon: styles.icon,
                  }}
                  style={{
                    color: "hsl(227, 18%, 70%)",
                  }}
                >
                  {column.label}
                  {orderBy === column.id ? (
                    <span
                      style={{
                        border: 0,
                        clip: "rect(0 0 0 0)",
                        height: 1,
                        margin: -1,
                        overflow: "hidden",
                        padding: 0,
                        position: "absolute",
                        top: 20,
                        width: 1,
                      }}
                    >
                      {order === "desc" ? "sorted descending" : "sorted ascending"}
                    </span>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell
              style={{
                width: 25,
                padding: 0,
                background: "var(--input-background)",
                borderBottom: rows.length === 0 ? "none" : "1.5px solid #5e9a9e",
              }}
            ></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stableSort(rows, getComparator(order, orderBy)).map((row, i) => (
            <TableRow key={row.title}>
              <TableCell
                component="th"
                scope="row"
                size="small"
                style={{
                  color: "hsl(227, 18%, 75%)",
                  borderBottom: i === rows.length - 1 ? "none" : "1.5px solid #5e9a9e",
                  padding: "6px 0px 6px 10px",
                  maxWidth: 100,
                }}
              >
                {row.title}
              </TableCell>
              <TableCell
                align="right"
                size="small"
                style={{
                  color: "hsl(227, 18%, 75%)",
                  borderBottom: i === rows.length - 1 ? "none" : "1.5px solid #5e9a9e",
                  padding: "6px 0px 6px 0px",
                  maxWidth: 80,
                }}
              >
                {row.in}
              </TableCell>
              <TableCell
                align="right"
                size="small"
                style={{
                  color: "hsl(227, 18%, 75%)",
                  borderBottom: i === rows.length - 1 ? "none" : "1.5px solid #5e9a9e",
                  padding: "6px 0px 6px 0px",
                  maxWidth: 80,
                }}
              >
                {row.out}
              </TableCell>
              <TableCell
                align="right"
                size="small"
                style={{
                  color: "hsl(227, 18%, 75%)",
                  borderBottom: i === rows.length - 1 ? "none" : "1.5px solid #5e9a9e",
                  padding: "6px 10px 6px 0px",
                  maxWidth: 80,
                }}
              >
                {row.degree}
              </TableCell>
              <TableCell
                style={{
                  padding: 0,
                  borderBottom: i === rows.length - 1 ? "none" : "1.5px solid #5e9a9e",
                }}
              >
                <button
                  onClick={() => removeTitle(row.title)}
                  style={{
                    width: 22,
                    height: 20,
                    fontSize: 20,
                    marginTop: 2,
                  }}
                >
                  <i className="icon ion-android-close" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Pages;
