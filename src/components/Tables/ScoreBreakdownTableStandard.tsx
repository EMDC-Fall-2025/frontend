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
      sx={{ m: 5, minWidth: 550, maxWidth: "90vw" }}
      component={Box}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>Criteria 1</TableCell>
            <TableCell>Criteria 2</TableCell>
            <TableCell>Criteria 3</TableCell>
            <TableCell>Scores</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {questions.map((question) => (
            <TableRow
              key={question.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {question.questionText}
              </TableCell>
              {question.id == 9 && (
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
                </>
              )}
              {(type == 2 || question.id != 4) && question.id != 9 ? (
                <>
                  <TableCell>
                    <Typography sx={{ mb: 1 }}>{question.criteria1}</Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {question.criteria1Points}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ mb: 1 }}>{question.criteria2}</Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {question.criteria2Points}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ mb: 1 }}>{question.criteria3}</Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {question.criteria3Points}
                    </Typography>
                  </TableCell>
                </>
              ) : (
                question.id != 9 && (
                  <>
                    <TableCell>
                      <Typography sx={{ mb: 1 }}>Jr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria1Junior}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>Sr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria1Senior}
                      </Typography>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {question.criteria1Points}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ mb: 1 }}>Jr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria2Junior}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>Sr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria2Senior}
                      </Typography>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {question.criteria2Points}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ mb: 1 }}>Jr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria3Junior}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>Sr:</Typography>
                      <Typography sx={{ mb: 1 }}>
                        {question.criteria3Senior}
                      </Typography>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {question.criteria3Points}
                      </Typography>
                    </TableCell>
                  </>
                )
              )}
              {question.id != 9 && (
                <>
                  {type === ScoreSheetType.Presentation && (
                    <TableCell>
                      {scoreSheetBreakdown &&
                        (scoreSheetBreakdown[ScoreSheetType.Presentation][
                          PresentationScoreSheetFields[
                            question.field as keyof typeof PresentationScoreSheetFields
                          ]
                        ] as any[]).reduce((sum, v) => (Number(sum) || 0) + (Number(v) || 0), 0)}
                    </TableCell>
                  )}
                  {type === ScoreSheetType.Journal && (
                    <TableCell>
                      {scoreSheetBreakdown &&
                        (scoreSheetBreakdown[ScoreSheetType.Journal][
                          JournalScoreSheetFields[
                            question.field as keyof typeof JournalScoreSheetFields
                          ]
                        ] as any[]).reduce((sum, v) => (Number(sum) || 0) + (Number(v) || 0), 0)}
                    </TableCell>
                  )}
                  {type === ScoreSheetType.MachineDesign && (
                    <TableCell>
                      {scoreSheetBreakdown &&
                        (scoreSheetBreakdown[ScoreSheetType.MachineDesign][
                          MachineDesignScoreSheetFields[
                            question.field as keyof typeof MachineDesignScoreSheetFields
                          ]
                        ] as any[]).reduce((sum, v) => (Number(sum) || 0) + (Number(v) || 0), 0)}
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
