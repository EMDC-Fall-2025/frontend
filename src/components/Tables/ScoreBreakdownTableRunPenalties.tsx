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
            backgroundColor: "rgba(46,125,50,0.04)",
          },
        }}
      >
        {/* Penalty name */}
        <TableCell sx={{ 
          py: { xs: 0.75, sm: 1.25 },
          minWidth: { xs: "120px", sm: "150px" }
        }}>
          <Typography sx={{ 
            fontWeight: 600,
            fontSize: { xs: "0.8rem", sm: "0.95rem" }
          }}>
            {text}
          </Typography>
        </TableCell>

        {/* Penalty type */}
        <TableCell sx={{ 
          py: { xs: 0.75, sm: 1.25 },
          minWidth: { xs: "100px", sm: "120px" }
        }}>
          <Typography 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.8rem", sm: "0.95rem" } }}
          >
            {penaltyType}
          </Typography>
        </TableCell>

        {/* Point value (numeric) */}
        <TableCell sx={{ 
          py: { xs: 0.75, sm: 0.25 }, 
          textAlign: "right", 
          whiteSpace: "nowrap",
          minWidth: "auto",
          width: "auto",
          padding: { xs: "4px", sm: "6px" }
        }}>
          <Typography sx={{ fontSize: { xs: "0.8rem", sm: "0.95rem" } }}>
            {pointValue}
          </Typography>
        </TableCell>

        {/* Points deducted (list from store) */}
        <TableCell sx={{ 
          py: { xs: 0.75, sm: 1.25 },
          minWidth: { xs: "120px", sm: "140px", md: "160px" },
          maxWidth: { xs: "180px", sm: "220px", md: "250px" },
          wordWrap: "break-word",
          overflow: "hidden"
        }}>
          <Typography sx={{ 
            fontSize: { xs: "0.75rem", sm: "0.9rem" },
            wordWrap: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {scoreSheetBreakdown &&
            scoreSheetBreakdown[ScoreSheetType.RunPenalties] &&
            scoreSheetBreakdown[ScoreSheetType.RunPenalties][
              RunPenaltiesScoreSheetFields[
                field as keyof typeof RunPenaltiesScoreSheetFields
              ]
            ] &&
            scoreSheetBreakdown[ScoreSheetType.RunPenalties][
              RunPenaltiesScoreSheetFields[
                field as keyof typeof RunPenaltiesScoreSheetFields
              ]
            ].length > 0
              ? scoreSheetBreakdown[ScoreSheetType.RunPenalties][
                  RunPenaltiesScoreSheetFields[
                    field as keyof typeof RunPenaltiesScoreSheetFields
                  ]
                ].map((v: any) => Math.abs(Number(v) || 0)).join(", ")
              : "0"}
          </Typography>
        </TableCell>
      </TableRow>
    );
  };

  return scoreSheetBreakdown ? (
    <TableContainer
      component={Paper}
      sx={{
        m: { xs: 2, sm: 5 },
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
          "& .MuiTableCell-root": {
            fontSize: { xs: "0.8rem", sm: "0.95rem" },
            py: { xs: 0.75, sm: 1.25 },
            px: { xs: 0.5, sm: 1 }
          }
        }}
      >
        {/* Header row */}
        <TableHead
          sx={{
            backgroundColor: theme.palette.error.light,
            "& th": {
              fontWeight: 700,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableRow>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "120px", sm: "150px" }
            }}>
              Penalty
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "100px", sm: "120px" }
            }}>
              Penalty Type
            </TableCell>
            <TableCell sx={{ 
              textAlign: "right",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: "auto",
              width: "auto",
              whiteSpace: "nowrap",
              padding: { xs: "4px", sm: "6px" }
            }}>
              Points
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.95rem" },
              minWidth: { xs: "120px", sm: "140px", md: "160px" },
              maxWidth: { xs: "180px", sm: "220px", md: "250px" },
              whiteSpace: { xs: "normal", sm: "nowrap" },
              lineHeight: { xs: 1.2, sm: 1.3 }
            }}>
              <Box sx={{ 
                display: { xs: "block", sm: "inline" },
                textAlign: { xs: "left", sm: "left" }
              }}>
                Deducted
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {runPenaltiesQuestionsList.map((penalty) => (
            <PenaltiesRow
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
