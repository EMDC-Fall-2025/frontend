import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import {
  JournalScoreSheetFields,
  MachineDesignScoreSheetFields,
  PresentationScoreSheetFields,
  ChampionshipScoreSheetFields,
  RedesignScoreSheetFields,
  ScoreSheetType,
} from "../../types";

interface IScoreBreakdownTable {
  type: number;
  questions: any[];
}

export default function ScoreBreakdownTableStandard(
  props: IScoreBreakdownTable
) {
  const { questions, type } = props;
  const { scoreSheetBreakdown } = useScoreSheetStore();

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
          {questions.map((question) => (
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
              {(question.id == 9 || (type === ScoreSheetType.Championship && (question.id == 17 || question.id == 18))) && (
                <>
                  {type === ScoreSheetType.MachineDesign && (
                    <TableCell colSpan={3}>
                      {scoreSheetBreakdown &&
                        scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                          MachineDesignScoreSheetFields.Comments
                        ][0] !== "" && (
                          <ul>
                            {scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                              MachineDesignScoreSheetFields.Comments
                            ].map((comment, index) => (
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
                  {type === ScoreSheetType.Presentation && (
                    <TableCell colSpan={3}>
                      {scoreSheetBreakdown &&
                        scoreSheetBreakdown[ScoreSheetType.Presentation][
                          PresentationScoreSheetFields.Comments
                        ][0] !== "" && (
                          <ul>
                            {scoreSheetBreakdown[ScoreSheetType.Presentation][
                              PresentationScoreSheetFields.Comments
                            ].map((comment, index) => (
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
                  {type === ScoreSheetType.Journal && (
                    <TableCell colSpan={3}>
                      {scoreSheetBreakdown &&
                        scoreSheetBreakdown[ScoreSheetType.Journal][
                          JournalScoreSheetFields.Comments
                        ][0] !== "" && (
                          <ul>
                            {scoreSheetBreakdown[ScoreSheetType.Journal][
                              JournalScoreSheetFields.Comments
                            ].map((comment, index) => (
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
                  {type === ScoreSheetType.Championship && question.id == 17 && (
                    <TableCell colSpan={3}>
                      {scoreSheetBreakdown &&
                        (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                          ChampionshipScoreSheetFields.field9
                        ][0] !== "" && (
                          <ul>
                            {(scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                              ChampionshipScoreSheetFields.field9
                            ].map((comment: any, index: number) => (
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
                  {type === ScoreSheetType.Championship && question.id == 18 && (
                    <TableCell colSpan={3}>
                      {scoreSheetBreakdown &&
                        (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                          ChampionshipScoreSheetFields.field18
                        ][0] !== "" && (
                          <ul>
                            {(scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                              ChampionshipScoreSheetFields.field18
                            ].map((comment: any, index: number) => (
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
                </>
              )}
              {(type == 2 || question.id != 4) && question.id != 9 && !(type === ScoreSheetType.Championship && (question.id == 17 || question.id == 18)) ? (
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
              ) : (
                question.id != 9 && (
                  <>
                    <TableCell sx={{ 
                      minWidth: { xs: "100px", sm: "120px" },
                      maxWidth: { xs: "120px", sm: "150px" }
                    }}>
                      <Typography sx={{ 
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Jr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria1Junior}
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Sr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria1Senior}
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
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Jr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria2Junior}
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Sr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria2Senior}
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
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Jr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria3Junior}
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: 600
                      }}>
                        Sr:
                      </Typography>
                      <Typography sx={{ 
                        mb: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        lineHeight: 1.2
                      }}>
                        {question.criteria3Senior}
                      </Typography>
                      <Typography sx={{ 
                        fontWeight: "bold",
                        fontSize: { xs: "0.8rem", sm: "0.95rem" }
                      }}>
                        {question.criteria3Points}
                      </Typography>
                    </TableCell>
                  </>
                )
              )}
              {question.id != 9 && !(type === ScoreSheetType.Championship && (question.id == 17 || question.id == 18)) && (
                <>
                  {type === ScoreSheetType.Presentation && (
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
                          scoreSheetBreakdown[ScoreSheetType.Presentation] &&
                          scoreSheetBreakdown[ScoreSheetType.Presentation][
                            PresentationScoreSheetFields[
                              question.field as keyof typeof PresentationScoreSheetFields
                            ]
                          ] &&
                          Array.isArray(scoreSheetBreakdown[ScoreSheetType.Presentation][
                            PresentationScoreSheetFields[
                              question.field as keyof typeof PresentationScoreSheetFields
                            ]
                          ]) &&
                          scoreSheetBreakdown[ScoreSheetType.Presentation][
                            PresentationScoreSheetFields[
                              question.field as keyof typeof PresentationScoreSheetFields
                            ]
                          ].join(", ")}
                      </Typography>
                    </TableCell>
                  )}
                  {type === ScoreSheetType.Journal && (
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
                          scoreSheetBreakdown[ScoreSheetType.Journal] &&
                          scoreSheetBreakdown[ScoreSheetType.Journal][
                            JournalScoreSheetFields[
                              question.field as keyof typeof JournalScoreSheetFields
                            ]
                          ] &&
                          Array.isArray(scoreSheetBreakdown[ScoreSheetType.Journal][
                            JournalScoreSheetFields[
                              question.field as keyof typeof JournalScoreSheetFields
                            ]
                          ]) &&
                          scoreSheetBreakdown[ScoreSheetType.Journal][
                            JournalScoreSheetFields[
                              question.field as keyof typeof JournalScoreSheetFields
                            ]
                          ].join(", ")}
                      </Typography>
                    </TableCell>
                  )}
                  {type === ScoreSheetType.MachineDesign && (
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
                          scoreSheetBreakdown[ScoreSheetType.MachineDesign] &&
                          scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                            MachineDesignScoreSheetFields[
                              question.field as keyof typeof MachineDesignScoreSheetFields
                            ]
                          ] &&
                          Array.isArray(scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                            MachineDesignScoreSheetFields[
                              question.field as keyof typeof MachineDesignScoreSheetFields
                            ]
                          ]) &&
                          scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                            MachineDesignScoreSheetFields[
                              question.field as keyof typeof MachineDesignScoreSheetFields
                            ]
                          ].join(", ")}
                      </Typography>
                    </TableCell>
                  )}
                  {type === ScoreSheetType.Championship && (
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
                          (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                            ChampionshipScoreSheetFields[
                              question.field as keyof typeof ChampionshipScoreSheetFields
                            ]
                          ] &&
                          Array.isArray((scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                            ChampionshipScoreSheetFields[
                              question.field as keyof typeof ChampionshipScoreSheetFields
                            ]
                          ]) &&
                          (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[
                            ChampionshipScoreSheetFields[
                              question.field as keyof typeof ChampionshipScoreSheetFields
                            ]
                          ].join(", ")}
                      </Typography>
                    </TableCell>
                  )}
                  {type === ScoreSheetType.Redesign && (
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
                          scoreSheetBreakdown[ScoreSheetType.Redesign] &&
                          scoreSheetBreakdown[ScoreSheetType.Redesign][
                            RedesignScoreSheetFields[
                              question.field as keyof typeof RedesignScoreSheetFields
                            ]
                          ] &&
                          Array.isArray(scoreSheetBreakdown[ScoreSheetType.Redesign][
                            RedesignScoreSheetFields[
                              question.field as keyof typeof RedesignScoreSheetFields
                            ]
                          ]) &&
                          scoreSheetBreakdown[ScoreSheetType.Redesign][
                            RedesignScoreSheetFields[
                              question.field as keyof typeof RedesignScoreSheetFields
                            ]
                          ].join(", ")}
                      </Typography>
                    </TableCell>
                  )}
                </>
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