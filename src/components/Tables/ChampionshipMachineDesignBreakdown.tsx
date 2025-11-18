import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { ScoreSheetType } from "../../types";
import { machineDesignQuestions } from "../../data/machineDesignQuestions";

/**
 * Championship Machine Design Breakdown
 * - Shows only Machine Design questions (fields 1-8) from championship scoresheets
 * - Includes Machine Design comments (field 9)
 * 
 */
export default function ChampionshipMachineDesignBreakdown() {
  const { scoreSheetBreakdown } = useScoreSheetStore();
  
  // Debug logging

  // Create machine design questions for championship (fields 1-8 + comments)
  const championshipMachineDesignQuestions = [
    ...machineDesignQuestions.slice(0, 8).map((q, index) => ({
      ...q,
      id: index + 1,
      field: `field${index + 1}`, // Championship fields 1-8
      section: "Machine Design",
      isPenalty: false
    })),
    // Add Machine Design comments (field 9)
    {
      id: 9,
      field: "field9",
      questionText: "Machine Design Comments",
      section: "Machine Design",
      isPenalty: false
    }
  ];

  return scoreSheetBreakdown ? (
    <TableContainer
      sx={{ 
        m: { xs: 2, sm: 5 }, 
        minWidth: { xs: 400, sm: 550 }, 
        maxWidth: "90vw",
        overflow: { xs: "auto", sm: "hidden" },
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#c1c1c1",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#a8a8a8",
        },
      }}
      component={Box}
    >
      <Table sx={{
        "& .MuiTableCell-root": {
          fontSize: { xs: "0.8rem", sm: "0.95rem" },
          py: { xs: 0.75, sm: 1.25 },
          px: { xs: 0.5, sm: 1 }
        }
      }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "120px", sm: "150px" }
            }}>
              Category
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "100px", sm: "120px" }
            }}>
              Criteria 1
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "100px", sm: "120px" }
            }}>
              Criteria 2
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "100px", sm: "120px" }
            }}>
              Criteria 3
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              minWidth: { xs: "80px", sm: "100px" }
            }}>
              Scores
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {championshipMachineDesignQuestions.map((question) => (
            <TableRow
              key={question.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell 
                component="th" 
                scope="row"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.95rem" },
                  minWidth: { xs: "120px", sm: "150px" },
                  maxWidth: { xs: "150px", sm: "200px" }
                }}
              >
                <Typography 
                  sx={{ 
                    fontSize: { xs: "0.8rem", sm: "0.95rem" },
                    fontWeight: 600,
                    lineHeight: 1.3
                  }}
                >
                  {question.questionText}
                </Typography>
              </TableCell>
              
              {/* Comments handling */}
              {question.id === 9 && (
                <TableCell colSpan={3}>
                  {scoreSheetBreakdown &&
                    scoreSheetBreakdown[ScoreSheetType.Championship] &&
                    (scoreSheetBreakdown[ScoreSheetType.Championship] as any)["field9"] &&
                    (scoreSheetBreakdown[ScoreSheetType.Championship] as any)["field9"][0] !== "" && (
                      <ul>
                        {(scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                          "field9"
                        ].map((comment: string, index: number) => (
                          <li key={index}>
                            <Typography sx={{ mb: 1 }}>
                              {comment}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    )}
                </TableCell>
              )}
              
              {/* Regular questions (not comments) */}
              {question.id !== 9 && (
                <>
                  <TableCell sx={{ 
                    minWidth: { xs: "100px", sm: "120px" },
                    maxWidth: { xs: "120px", sm: "150px" }
                  }}>
                    <Typography sx={{ 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: "0.75rem", sm: "0.9rem" },
                      lineHeight: 1.3
                    }}>
                      {question.criteria1}
                    </Typography>
                    <Typography sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.8rem", sm: "0.95rem" }
                    }}>
                      {question.criteria1Points}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    minWidth: { xs: "100px", sm: "120px" },
                    maxWidth: { xs: "120px", sm: "150px" }
                  }}>
                    <Typography sx={{ 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: "0.75rem", sm: "0.9rem" },
                      lineHeight: 1.3
                    }}>
                      {question.criteria2}
                    </Typography>
                    <Typography sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.8rem", sm: "0.95rem" }
                    }}>
                      {question.criteria2Points}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    minWidth: { xs: "100px", sm: "120px" },
                    maxWidth: { xs: "120px", sm: "150px" }
                  }}>
                    <Typography sx={{ 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: "0.75rem", sm: "0.9rem" },
                      lineHeight: 1.3
                    }}>
                      {question.criteria3}
                    </Typography>
                    <Typography sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.8rem", sm: "0.95rem" }
                    }}>
                      {question.criteria3Points}
                    </Typography>
                  </TableCell>
                </>
              )}
              
              {/* Scores column */}
              {question.id !== 9 && (
                <TableCell sx={{ 
                  minWidth: { xs: "80px", sm: "100px" },
                  maxWidth: { xs: "100px", sm: "120px" }
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: "0.8rem", sm: "0.95rem" },
                    fontWeight: 600,
                    textAlign: "center"
                  }}>
                    {scoreSheetBreakdown &&
                      scoreSheetBreakdown[ScoreSheetType.Championship] &&
                      (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[question.field] &&
                      Array.isArray((scoreSheetBreakdown[ScoreSheetType.Championship] as any)[question.field]) &&
                      (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[question.field].join(", ")}
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <CircularProgress />
  );
}