import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { GeneralPenaltiesScoreSheetFields, ScoreSheetType } from "../../types";
import { generalPenaltiesQuestions } from "../../data/generalPenaltiesQuestions";
import theme from "../../theme";

/**
 * Public Score Breakdown — General Penalties table
 * - Reads penalty breakdown from the score sheet store (already populated upstream)
 * - Renders a read-only table of penalties, types, point values, and deducted points
 */
export default function ScoreBreakdownTableGeneralPenalties() {
  const { scoreSheetBreakdown } = useScoreSheetStore();

  const PenaltiesRow: React.FC<{
    text: string;
    field: string;
    pointValue: number;
    penaltyType: string;
  }> = ({ text, field, pointValue, penaltyType }) => {
    return (
      <TableRow
        sx={{
          "&:hover td": {
            backgroundColor: "rgba(46,125,50,0.04)",
          },
        }}
      >
        {/* Penalty name */}
        <TableCell sx={{ py: 1.25 }}>
          <Typography sx={{ fontWeight: 600 }}>{text}</Typography>
        </TableCell>

        {/* Penalty type */}
        <TableCell sx={{ py: 1.25 }}>
          <Typography color="text.secondary">{penaltyType}</Typography>
        </TableCell>

        {/* Point value (numeric) */}
        <TableCell sx={{ py: 1.25, textAlign: "right", whiteSpace: "nowrap" }}>
          <Typography>{pointValue}</Typography>
        </TableCell>

        {/* Points deducted (list from store) */}
        <TableCell sx={{ py: 1.25 }}>
          {scoreSheetBreakdown &&
            scoreSheetBreakdown[ScoreSheetType.GeneralPenalties][
              GeneralPenaltiesScoreSheetFields[
                field as keyof typeof GeneralPenaltiesScoreSheetFields
              ]
            ].join(", ")}
        </TableCell>
      </TableRow>
    );
  };


  return scoreSheetBreakdown ? (
    <TableContainer
      component={Paper}
      sx={{
        m: 5,
        maxWidth: "90vw",
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[300]}`,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Table
        sx={{
          "& td, & th": { borderColor: theme.palette.grey[200] },
          tableLayout: "auto",
        }}
      >
        {/* Header row */}
        <TableHead
          sx={{
            backgroundColor: theme.palette.grey[50],
            "& th": {
              fontWeight: 700,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableRow>
            <TableCell>Penalty</TableCell>
            <TableCell>Penalty Type</TableCell>
            <TableCell sx={{ textAlign: "right" }}>
              Point Value (Per occurrence if applicable)
            </TableCell>
            <TableCell>Points Deducted</TableCell>
          </TableRow>
        </TableHead>

        {/* Body rows */}
        <TableBody>
          {generalPenaltiesQuestions.map((penalty) => (
            <PenaltiesRow
              key={penalty.field}
              text={penalty.questionText}
              field={penalty.field}
              pointValue={penalty.pointValue}
              penaltyType={penalty.penaltyType}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <CircularProgress />
    </Box>
  );
}
