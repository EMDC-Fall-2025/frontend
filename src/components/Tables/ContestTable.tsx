import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

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

export default function ContestTable({ rows, isLoading, onRowClick }: ContestTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="contest table">
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography>Loading contests...</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{ cursor: "pointer" }}
                onClick={() => onRowClick(row.id)}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell
                  sx={{
                    color:
                    row.status === "Finalized"
                    ? "Green"
                    : row.status === "In Progress"
                    ? "Orange"
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
