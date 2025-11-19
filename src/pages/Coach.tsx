import * as React from "react";
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import CoachTeamScoresTable from "../components/Tables/CoachTeamScoresTable";
import theme from "../theme";

export default function Coach() {
  const { role, setShowPreloader, setPreloaderProgress } = useAuthStore();
  const { teams, fetchTeamsByCoachId, clearTeams } = useMapCoachToTeamStore();
  const { contestsForTeams, fetchContestsByTeams, clearContests } =
    useMapContestToTeamStore();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (role?.user.id) {
      fetchTeamsByCoachId(role.user.id).then(() => {
        setHasLoaded(true);
        isInitialLoadRef.current = false;
      });
    }
    return () => {
      clearTeams();
    };
  }, [role]);

  useEffect(() => {
    if (teams.length > 0) {
      fetchContestsByTeams(teams);
    }
    return () => {
      clearContests();
    };
  }, [teams]);

  /**
   * Start minimum 1.5 second timer when component mounts
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500); // 1.5 seconds minimum

    return () => clearTimeout(timer);
  }, []);

  /**
   * Hide preloader when both data is loaded AND minimum time has elapsed
   */
  useEffect(() => {
    if (hasLoaded && minTimeElapsed) {
      setShowPreloader(false);
      setPreloaderProgress(''); 
    }
  }, [hasLoaded, minTimeElapsed, setShowPreloader, setPreloaderProgress]);

  useEffect(() => {
    const handlePageHide = () => {
      clearContests();
      clearTeams();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  const createData = (
    id: number,
    name: string,
    contest: string,
    isDisqualified: boolean
  ) => ({
    id,
    name,
    contest,
    isDisqualified,
  });

  const rows = teams.map((team) =>
    createData(
      team.id,
      team.team_name,
      contestsForTeams[team.id]?.name || "—",
      team.organizer_disqualified
    )
  );

  const Row = ({ row, index }: { row: ReturnType<typeof createData>; index: number }) => {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <TableRow
          sx={{ "& > *": { borderBottom: "unset" } }}
          onClick={() => setOpen(!open)}
          hover
        >
          <TableCell>
            <IconButton aria-label="expand row" size="small">
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            {row.name}
          </TableCell>
          <TableCell>{row.contest}</TableCell>
          <TableCell>
            {row.isDisqualified ? (
              <Typography sx={{ color: "red" }}>Disqualified</Typography>
            ) : (
              "Active"
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ m: 2 }}>
                <CoachTeamScoresTable 
                  team={teams[index]} 
                  contest={contestsForTeams[teams[index].id]} 
                />
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  const StatCard = ({ value, label }: { value: number | string; label: string }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.grey[200]}`,
        background: `linear-gradient(135deg, #ffffff 0%, #fafafa 100%)`,
        boxShadow: `0 2px 8px rgba(76, 175, 80, 0.08)`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0 4px 16px rgba(76, 175, 80, 0.12)`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: theme.palette.success.light,
          opacity: 0.1,
        }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: theme.palette.success.dark, lineHeight: 1, mb: 0.5 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            opacity: hasLoaded ? 1 : 0,
            transition: hasLoaded ? `opacity ${isInitialLoadRef.current ? '0.6s' : '0.1s'} ease-in` : 'none',
            pointerEvents: hasLoaded ? 'auto' : 'none',
          }}
        >
          <Stack spacing={1} sx={{ mb: 2, mt: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 400, 
              color: theme.palette.success.main,
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Coach Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {role?.user?.first_name} {role?.user?.last_name}
          </Typography>
        </Stack>

        {/* Stat Card */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard value={teams.length} label="Teams Coached" />
          </Grid>
        </Grid>

        {/* Collapsible Table Section */}
        <Box
          sx={{
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 3,
            backgroundColor: "#fff",
          }}
        >
          <Box sx={{ px: 3, py: 2 , backgroundColor:" rgba(46, 125, 50, 0.06)"  }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Teams Overview
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: 3, pb: 3 }}>
            {teams.length > 0 ? (
              <TableContainer component={Box}>
                <Table>
                  <TableBody>
                    {rows.map((row, index) => (
                      <Row key={row.id} row={row} index={index} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No teams assigned yet.</Typography>
            )}
          </Box>
        </Box>
        </Box>
      </Container>
    </Box>
  );
}
