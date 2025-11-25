import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { ScoreSheetType } from "../../types";
import { generalPenaltiesQuestions } from "../../data/generalPenaltiesQuestions";
import theme from "../../theme";

/**
 * Championship Score Breakdown — General Penalties table
 * - Reads penalty breakdown from championship scoresheets (fields 19-25)
 * - Renders a read-only table of penalties, types, point values, and deducted points
 */
export default function ChampionshipScoreBreakdownTableGeneralPenalties() {
  const { scoreSheetBreakdown } = useScoreSheetStore();

  const PenaltiesRow: React.FC<{
    id: number;
    text: string;
    field: string;
    pointValue: number;
    penaltyType: string;
  }> = ({ id, text, pointValue, penaltyType }) => {
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

        {/* Points deducted (calculated from stored values) */}
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
            {(() => {
              if (!scoreSheetBreakdown || !scoreSheetBreakdown[ScoreSheetType.Championship]) return "0";
              // Championship general penalties are stored in fields 19-25; map by item id (1..7)
              const fieldNumber = 18 + Number(id || 0);
              // Access by string key (backend uses string keys like "field19")
              const key = `field${fieldNumber}`;
              const values = (scoreSheetBreakdown[ScoreSheetType.Championship] as any)[key] as any[] | undefined;
              if (!values || values.length === 0) return "0";
              // Determine calculation mode: yes/no vs increment
              const question = generalPenaltiesQuestions.find(p => p.id === id);
              const isIncrement = question?.isIncrement === true;
              let count = 0;
              if (isIncrement) {
                // Simple normalization: treat each entry as either a count or a raw point value
                const pv = Number(pointValue) || 0;
                const normalizedCounts = values.map((v) => {
                  const n = Math.abs(Number(v) || 0);
                  if (pv > 0 && n >= pv) return Math.round(n / pv);
                  return n; 
                });
                count = normalizedCounts.reduce((sum, n) => sum + n, 0);
              } else {
                // Count truthy entries as occurrences (use abs to handle negative values)
                count = values.reduce((sum, v) => sum + (Math.abs(Number(v) || 0) > 0 ? 1 : 0), 0);
              }
              const deducted = count * Number(pointValue || 0);
              return `${deducted}`;
            })()}
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

        {/* Body rows */}
        <TableBody>
          {generalPenaltiesQuestions.map((penalty) => (
            <PenaltiesRow
              key={penalty.field}
              id={penalty.id}
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
