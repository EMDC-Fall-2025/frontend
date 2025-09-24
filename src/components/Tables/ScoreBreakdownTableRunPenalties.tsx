import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { RunPenaltiesScoreSheetFields, ScoreSheetType } from "../../types";
import { runPenaltiesQuestions } from "../../data/runPenaltiesQuestions";
import theme from "../../theme";

export default function ScoreBreakdownTableRunPenalties() {
  const { scoreSheetBreakdown } = useScoreSheetStore();

  const runPenaltiesQuestionsList = runPenaltiesQuestions.filter(
    (question) => question.id !== 9
  );

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
            // subtle full-row hover to match the theme
            backgroundColor: "rgba(46,125,50,0.04)",
          },
        }}
      >
        {/* Penalty name */}
        <TableCell sx={{ py: 1.25, wordWrap: "break-word" }}>
          <Typography sx={{ fontWeight: 600 }}>{text}</Typography>
        </TableCell>

        {/* Penalty type */}
        <TableCell sx={{ py: 1.25, wordWrap: "break-word" }}>
          <Typography color="text.secondary">{penaltyType}</Typography>
        </TableCell>

        {/* Point value (numeric) */}
        <TableCell sx={{ py: 1.25, textAlign: "right", whiteSpace: "nowrap" }}>
          <Typography>{pointValue}</Typography>
        </TableCell>

        {/* Points deducted (list from store) */}
        <TableCell sx={{ py: 1.25, wordWrap: "break-word" }}>
          {scoreSheetBreakdown &&
            scoreSheetBreakdown[ScoreSheetType.RunPenalties][
              RunPenaltiesScoreSheetFields[
                field as keyof typeof RunPenaltiesScoreSheetFields
              ]
            ].join(", ")}
        </TableCell>
      </TableRow>
    );
  };

  // Show spinner while breakdown is not available yet
  return scoreSheetBreakdown ? (
    <TableContainer
      // Card-like surface to match Admin/Public cards
      component={Paper}
      sx={{
        m: 0,
        maxWidth: "100%",
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Table
        sx={{
          "& td, & th": { borderColor: theme.palette.grey[200] },
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        {/* Header row */}
        <TableHead
          sx={{
            backgroundColor: theme.palette.grey[50],
            "& th": {
              fontWeight: 700,
              color: theme.palette.text.primary,
              whiteSpace: "normal",
              wordWrap: "break-word",
            },
          }}
        >
          <TableRow>
            <TableCell sx={{ minWidth: "200px" }}>Penalty</TableCell>
            <TableCell sx={{ minWidth: "150px" }}>Penalty Type</TableCell>
            <TableCell sx={{ textAlign: "right", minWidth: "200px" }}>
              Point Value (Per occurrence if applicable)
            </TableCell>
            <TableCell sx={{ minWidth: "250px" }}>
              Points Deducted (points shown are averaged for final deduction)
            </TableCell>
          </TableRow>
        </TableHead>
        {/* Body rows */}
        <TableBody>
          {runPenaltiesQuestionsList.map((penalty) => (
            <PenaltiesRow
              key={penalty.field} // key for stable rendering
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
