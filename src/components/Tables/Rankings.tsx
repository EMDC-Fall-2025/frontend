import { Button, Box, Checkbox, Collapse, IconButton, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha } from "@mui/material";
import React, { useState } from "react";
import theme from "../../theme";
import { TriangleIcon, Trophy} from "lucide-react";



const fakeData = {
    clusters: [
      {
        id: 1,
        name: "Cluster A",
        teams: [

          { id: 2, name: "Team Beta", totalScore: 89.2, rank: 2, scores: { presentation: 22, journal: 23, mdo: 24, penalties: 20.2 } },
          { id: 3, name: "Team Gamma", totalScore: 87.8, rank: 3, scores: { presentation: 21, journal: 22, mdo: 23, penalties: 21.8 } },
          { id: 1, name: "Team Alpha", totalScore: 95.5, rank: 1, scores: { presentation: 23, journal: 24, mdo: 25, penalties: 23.5 } },
          { id: 4, name: "Team Delta", totalScore: 82.1, rank: 4, scores: { presentation: 20, journal: 21, mdo: 22, penalties: 19.1 } }
        ]
      },
      {
        id: 2,
        name: "Cluster B", 
        teams: [
          { id: 5, name: "Team Echo", totalScore: 93.7, rank: 1, scores: { presentation: 24, journal: 23, mdo: 24, penalties: 22.7 } },
          { id: 8, name: "Team Hotel", totalScore: 85.4, rank: 4, scores: { presentation: 21, journal: 22, mdo: 21, penalties: 21.4 } },
          { id: 6, name: "Team Foxtrot", totalScore: 91.3, rank: 2, scores: { presentation: 23, journal: 24, mdo: 23, penalties: 21.3 } },
          { id: 7, name: "Team Golf", totalScore: 88.9, rank: 3, scores: { presentation: 22, journal: 23, mdo: 22, penalties: 21.9 } },
          
        ]
      },
      {
        id: 3,
        name: "Cluster C",
        teams: [
          { id: 9, name: "Team India", totalScore: 96.2, rank: 1, scores: { presentation: 25, journal: 24, mdo: 25, penalties: 22.2 } },
          { id: 10, name: "Team Juliet", totalScore: 90.8, rank: 2, scores: { presentation: 23, journal: 23, mdo: 24, penalties: 20.8 } },
          { id: 11, name: "Team Kilo", totalScore: 86.5, rank: 3, scores: { presentation: 22, journal: 22, mdo: 23, penalties: 19.5 } },
          { id: 12, name: "Team Lima", totalScore: 83.7, rank: 4, scores: { presentation: 21, journal: 21, mdo: 22, penalties: 19.7 } }
        ]
      }
    ]
  };

  const Ranking = () => {
    const [selectedTeams, setSelectedTeams] = useState<number[]>([])
    const [openCluster, setOpenCluster] = useState<Set<number>>(new Set())
  
    const toggleCluster = (id: number) => {
      setOpenCluster((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    }
  
    const handleSelect = (teamId: number) => {
      setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
    }
  
    return (

      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>

        <Box sx={{ mb: 4, mt: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              borderLeft: `4px solid ${theme.palette.success.main}`,
              pl: 2,
            }}
          >
            Team Rankings
          </Typography>

          {/* Stats Card */}
        
        <Paper
            elevation={1}
            sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
            bgcolor: "white",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Selected Teams
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {selectedTeams.length}
                </Typography>
            </Box>
            <Box sx={{ color: theme.palette.grey[400] }}>
                <Trophy size={24} />
            </Box>
            </Box>
            </Paper>
       
  
           </Box>
  
        {fakeData.clusters.map((cluster) => {
          const isOpen = openCluster.has(cluster.id)
          return (
            <TableContainer
                key={cluster.id}
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    overflow: "hidden",
                    mb: 2,
                }}
                >
        <Table>
    {/* Cluster header row */}
    <TableRow sx={{ bgcolor: theme.palette.grey[200], borderBottom: `1px solid ${theme.palette.divider}` }}>
      <TableCell colSpan={5} sx={{ py: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => toggleCluster(cluster.id)}
              sx={{
                mr: 1,
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms",
              }}
            >
              <TriangleIcon color={theme.palette.success.main} fill="none" size={16} strokeWidth={2} />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 16 }}>
              {cluster.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Teams</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{cluster.teams.length}</Typography>
          </Box>
        </Box>
      </TableCell>
    </TableRow>

    {/* Collapsible content row */}
    <TableRow>
      <TableCell colSpan={5} sx={{ p: 0 }}>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 700,
                    bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                    borderBottomColor: "grey.300",
                    fontSize: "0.95rem",
                    py: 1.25,
                  },
                }}
              >
                <TableCell />
                <TableCell>Rank</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>Total Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cluster.teams
                .sort((a, b) => a.rank - b.rank)
                .map((team) => (
                  <TableRow
                    key={team.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(46,125,50,0.06)" },
                      borderBottom: `1px solid ${theme.palette.grey[200]}`,
                      "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        color="success"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleSelect(team.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {team.rank <= 4 && (
                          <Trophy
                            size={18}
                            color={theme.palette.success.main}
                            fill={theme.palette.success.main}
                          />
                        )}
                        <Typography>#{team.rank}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
        
                      }}
                    >
                      {team.totalScore}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: theme.palette.success.main,
                          "&:hover": { bgcolor: theme.palette.success.dark },
                          color: "#fff",
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        View Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </TableRow>
  </Table>
</TableContainer>
          )
        })}
      </Box>
    )
  }
  
  export default Ranking