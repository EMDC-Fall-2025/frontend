import {
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";
import { useEffect } from "react";

const COLS = [
  { key: "rank", label: "Rank", width: "6%", align: "center" as const },
  { key: "team", label: "Team", width: "18%", align: "left" as const },
  { key: "school", label: "School", width: "18%", align: "left" as const },
  { key: "journal", label: "Journal", width: "8%", align: "center" as const },
  { key: "presentation", label: "Present.", width: "8%", align: "center" as const },
  { key: "machine", label: "Machine", width: "10%", align: "center" as const },
  { key: "general_penalties", label: "Gen. Penalties", width: "9%", align: "center" as const },
  { key: "run_penalties", label: "Run Penalties", width: "9%", align: "center" as const },
  { key: "penalties", label: "Penalties", width: "8%", align: "center" as const },
  { key: "total", label: "Total", width: "8%", align: "center" as const },
  { key: "details", label: "Details", width: "8%", align: "center" as const },
];

const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const bgGold = (t: any) => alpha(GOLD, 0.18);
const bgSilver = (t: any) => alpha(SILVER, 0.18);
const bgBronze = (t: any) => alpha(BRONZE, 0.18);

export default function InternalResultsTable({ contestId }: { contestId?: number }) {
  const { teamsByContest } = useMapContestToTeamStore();
  const {clusters, teamsByClusterId, fetchClustersByContestId, getTeamsByClusterId, clearTeamsByClusterId} = useMapClusterTeamStore();
  const navigate = useNavigate();

  const rows = (teamsByContest ?? []) as any[];
 
  // Clear cluster data when contest changes
  useEffect(() => {
    if (contestId) {
      console.log('Fetching clusters for contest:', contestId);
      clearTeamsByClusterId();
      // Fetch clusters for this contest
      fetchClustersByContestId(contestId).then(() => {
        console.log('Clusters fetch completed');
      }).catch(error => {
        console.error('Error fetching clusters:', error);
      });
    }
  }, [contestId, clearTeamsByClusterId, fetchClustersByContestId]);

  // Fetch teams for each cluster when clusters are loaded
  useEffect(()=>{
    console.log('Clusters loaded:', clusters);
    console.log('Number of clusters:', clusters.length);
    if (clusters.length > 0){
      clusters.forEach(cluster =>{
        console.log('Fetching teams for cluster:', cluster.id, cluster.cluster_name);
        getTeamsByClusterId(cluster.id).then(() => {
          console.log('Teams fetched for cluster:', cluster.id);
          console.log('Teams in cluster:', teamsByClusterId[cluster.id]);
        }).catch(error => {
          console.error('Error fetching teams for cluster:', cluster.id, error);
        });
      })
    }
  },[clusters, getTeamsByClusterId])

  // Debug: log teamsByClusterId when it changes
  useEffect(() => {
    console.log('teamsByClusterId updated:', teamsByClusterId);
    console.log('Contest teams:', rows.map(t => ({ id: t.id, name: t.team_name })));
  }, [teamsByClusterId, rows]);

  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0 }}>
      {/* Wrapper that enables smooth horizontal scroll on small screens */}
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 1,
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table
          size="small"
          sx={{
            // Force a wide natural width so mobile uses horizontal scroll instead of squeezing
            width: "1200px",
            minWidth: "1200px",
            tableLayout: "fixed",
          }}
          aria-label="contest results"
        >
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.success.main, 0.08) }}>
              {COLS.map((c) => {
                const isPenaltyHeader =
                  c.key === "general_penalties" || c.key === "run_penalties";

                return (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    sx={{
                      width: c.width,
                      fontWeight: 800,
                      fontSize: { xs: "0.72rem", sm: "0.875rem" },
                      // add a little more height for wrapped penalty headers
                      py: { xs: isPenaltyHeader ? 1.0 : 0.6, sm: 1 },
                      px: { xs: isPenaltyHeader ? 0.5 : 0.5, sm: 1 },

                      // ✅ Fix overflow only for penalties headers (allow wrap)
                      ...(isPenaltyHeader && {
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        hyphens: "auto",
                        lineHeight: 1.15,
                        textAlign: "center",
                      }),

                      // keep others single-line
                      ...(!isPenaltyHeader && { whiteSpace: "nowrap" }),

                      // colors
                      ...(c.key === "penalties" && { color: "error.main" }),
                      ...(c.key === "total" && {
                        color: "common.white",
                        bgcolor: "success.main",
                      }),
                    }}
                  >
                    {c.label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((team: any, idx: number) => {
              const rank = team.team_rank ?? null;
              const is1 = rank === 1;
              const is2 = rank === 2;
              const is3 = rank === 3;

              let rowBg: any = idx % 2 ? "grey.50" : "background.paper";
              let borderColor: string | undefined;

              if (is1) {
                rowBg = (t: any) => bgGold(t);
                borderColor = GOLD;
              }
              if (is2) {
                rowBg = (t: any) => bgSilver(t);
                borderColor = SILVER;
              }
              if (is3) {
                rowBg = (t: any) => bgBronze(t);
                borderColor = BRONZE;
              }

              const school: string = team.school ?? team.school_name ?? "—";

              return (
                <TableRow
                  key={team.id}
                  hover
                  sx={{
                    bgcolor: rowBg,
                    borderTop: borderColor ? `3px solid ${borderColor}` : undefined,
                    borderBottom: borderColor ? `3px solid ${borderColor}` : undefined,
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 900, color: borderColor ?? "text.primary" }}>
                    {rank ?? "—"} {is1 ? "🏆" : is2 ? "🥈" : is3 ? "🥉" : null}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={700}>{team.team_name}</Typography>
                    <Typography variant="caption" color="text.disabled">
                    {(() => {
                      // Find which cluster this team belongs to
                    // format: teamsByClusterId = {
                    //     "29": [team1, team2, team3],     // Cluster 29 has 3 teams
                    //     "50": [team4, team5],            // Cluster 50 has 2 teams  
                    //     "51": [team6],                   // Cluster 51 has 1 team
                    //     "32": [team7, team8, team9]       // Cluster 32 has 3 teams
                    // Find the most specific cluster for this team (not "All Teams")
                    const teamClusters = [];
                    for (const clusterId in teamsByClusterId) {
                      const teamsInCluster = teamsByClusterId[clusterId];
                      if (teamsInCluster && teamsInCluster.some((t: any) => t.id === team.id)) {
                        const cluster = clusters.find(c => c.id === parseInt(clusterId));
                        if (cluster && cluster.cluster_name !== 'All Teams') {
                          teamClusters.push(cluster);
                        }
                      }
                    }
                    
                    // Return the first specific cluster found, or fallback to "All Teams" or team ID
                    if (teamClusters.length > 0) {
                      return teamClusters[0].cluster_name;
                    }
                    
                    // If no specific cluster found, check if team is in "All Teams" cluster
                    for (const clusterId in teamsByClusterId) {
                      const teamsInCluster = teamsByClusterId[clusterId];
                      if (teamsInCluster && teamsInCluster.some((t: any) => t.id === team.id)) {
                        const cluster = clusters.find(c => c.id === parseInt(clusterId));
                        if (cluster && cluster.cluster_name === 'All Teams') {
                          return 'Unassigned';
                        }
                      }
                    }
                    
                    return `ID: ${team.id}`;
                  })()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{school}</Typography>
                  </TableCell>

                  <TableCell align="center">{team.journal_score}</TableCell>
                  <TableCell align="center">{team.presentation_score}</TableCell>
                  <TableCell align="center">{team.machinedesign_score}</TableCell>

                  {/* New columns */}
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                    -{Number(team.preliminary_penalties_score ?? 0).toFixed(1)}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                    -{Number(team.redesign_score ?? 0).toFixed(1)}
                  </TableCell>

                  {/* Existing penalties */}
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 800 }}>
                    -{Number(team.penalties_score).toFixed(1)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 900,
                      color: "common.white",
                      bgcolor: is1 ? GOLD : is2 ? SILVER : is3 ? BRONZE : "success.main",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {Number(team.total_score).toFixed(1)}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => navigate(`/score-breakdown/${team.id}`)}
                      sx={{
                        fontSize: { xs: "0.6rem", sm: "0.75rem" },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.25, sm: 0.5 }
                      }}
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
