import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import theme from "../../theme";

interface ContestRow {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface ContestTableProps {
  rows: ContestRow[];
  isLoading: boolean;
  onRowClick: (contestId: number) => void;
}

export default function ContestTable({
  rows,
  isLoading,
  onRowClick,
}: ContestTableProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: 3,
      }}
    >
      <Table
        aria-label="contest table"
        sx={{
          "& th:first-of-type, & td:first-of-type": { pl: 1 },
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
            <TableCell sx={{ fontWeight: 700, color: "#fff" }}>
              Contest Name
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#fff" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#fff" }}>Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography>Loading contests...</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onRowClick(row.id)}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell
                  sx={{
                    color:
                      row.status === "Finalized"
                        ? "green"
                        : row.status === "In Progress"
                          ? "orange"
                          : "red",
                    fontWeight: 600,
                  }}
                >
                  {row.status}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
