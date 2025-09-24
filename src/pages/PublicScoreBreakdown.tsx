import { CircularProgress, Link, Typography, Box, Container, Paper, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { 
  Description as JournalIcon,
  Mic as PresentationIcon,
  Build as MachineDesignIcon,
  Warning as GeneralPenaltiesIcon,
  DirectionsRun as RunPenaltiesIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";
import theme from "../theme";
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import { journalQuestions } from "../data/journalQuestions";
import { presentationQuestions } from "../data/presentationQuestions";
import { machineDesignQuestions } from "../data/machineDesignQuestions";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ScoreBreakdownTableGeneralPenalties from "../components/Tables/ScoreBreakdownTableGeneralPenalties";
import ScoreBreakdownTableRunPenalties from "../components/Tables/ScoreBreakdownTableRunPenalties";
import { api } from "../lib/api";

export default function PublicScoreBreakdown() {
  const { teamId, contestId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoreBreakdown = async () => {
      if (parsedTeamId && parsedContestId) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Use the public API endpoint
          await api.get(`/scoreSheet/getPublicDetails/${parsedTeamId}/?contestid=${parsedContestId}`);
          // Data is loaded, component will render the score breakdown tables
        } catch (err: any) {
          console.error('Error fetching score breakdown:', err);
          setError(err.response?.data?.error || 'Failed to load score breakdown');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchScoreBreakdown();
  }, [parsedTeamId, parsedContestId]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ backgroundColor: "#fafafa", minHeight: "100vh", pb: 4 }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              mb: 4,
              p: 4,
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            }}
          >
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              Error Loading Score Breakdown
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#fafafa", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            mb: 4,
            p: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.grey[200]}`,
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          }}
        >
          {/* Back Button */}
          <Box sx={{ mb: 3 }}>
            <Link
              onClick={() => window.history.back()}
              sx={{ textDecoration: "none", cursor: "pointer" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BackIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    "&:hover": { color: theme.palette.primary.dark }
                  }}
                >
                  Back to Results
                </Typography>
              </Box>
            </Link>
          </Box>

          {/* Title */}
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 550,
              fontSize: 28,
              color: theme.palette.primary.main,
              mb: 1,
            }}
          >
            Score Breakdown
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Detailed scoring analysis and feedback for all categories
          </Typography>
        </Paper>

        {/* Content Sections */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Journal Section */}
          <Accordion 
            defaultExpanded
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white", fontSize: 28 }} />}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                minHeight: 64,
                "&.Mui-expanded": { minHeight: 64 },
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                  "&.Mui-expanded": { margin: "12px 0" },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <JournalIcon sx={{ fontSize: 32 }} />
                <Typography variant="h2" sx={{ fontWeight: 550, fontSize: 20, m: 0, color: "white" }}>
                  Journal
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, m: 0 }}>
              <ScoreBreakdownTableStandard type={2} questions={journalQuestions} />
            </AccordionDetails>
          </Accordion>

          {/* Presentation Section */}
          <Accordion 
            defaultExpanded
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white", fontSize: 28 }} />}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                minHeight: 64,
                "&.Mui-expanded": { minHeight: 64 },
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                  "&.Mui-expanded": { margin: "12px 0" },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PresentationIcon sx={{ fontSize: 32 }} />
                <Typography variant="h2" sx={{ fontWeight: 550, fontSize: 20, m: 0, color: "white" }}>
                  Presentation
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, m: 0 }}>
              <ScoreBreakdownTableStandard type={1} questions={presentationQuestions} />
            </AccordionDetails>
          </Accordion>

          {/* Machine Design Section */}
          <Accordion 
            defaultExpanded
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white", fontSize: 28 }} />}
              sx={{
                backgroundColor: theme.palette.primary.dark,
                color: "white",
                minHeight: 64,
                "&.Mui-expanded": { minHeight: 64 },
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                  "&.Mui-expanded": { margin: "12px 0" },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <MachineDesignIcon sx={{ fontSize: 32 }} />
                <Typography variant="h2" sx={{ fontWeight: 550, fontSize: 20, m: 0, color: "white" }}>
                  Machine Design and Operation
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, m: 0 }}>
              <ScoreBreakdownTableStandard
                type={3}
                questions={machineDesignQuestions}
              />
            </AccordionDetails>
          </Accordion>

          {/* General Penalties Section */}
          <Accordion 
            defaultExpanded
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white", fontSize: 28 }} />}
              sx={{
                backgroundColor: "#8B4513",
                color: "white",
                minHeight: 64,
                "&.Mui-expanded": { minHeight: 64 },
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                  "&.Mui-expanded": { margin: "12px 0" },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <GeneralPenaltiesIcon sx={{ fontSize: 32 }} />
                <Typography variant="h2" sx={{ fontWeight: 550, fontSize: 20, m: 0, color: "white" }}>
                  General Penalties
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, m: 0 }}>
              <ScoreBreakdownTableGeneralPenalties />
            </AccordionDetails>
          </Accordion>

          {/* Run Penalties Section */}
          <Accordion 
            defaultExpanded
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[200]}`,
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white", fontSize: 28 }} />}
              sx={{
                backgroundColor: "#DC143C",
                color: "white",
                minHeight: 64,
                "&.Mui-expanded": { minHeight: 64 },
                "& .MuiAccordionSummary-content": {
                  margin: "12px 0",
                  "&.Mui-expanded": { margin: "12px 0" },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <RunPenaltiesIcon sx={{ fontSize: 32 }} />
                <Typography variant="h2" sx={{ fontWeight: 550, fontSize: 20, m: 0, color: "white" }}>
                  Run Penalties
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, m: 0 }}>
              <ScoreBreakdownTableRunPenalties />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Container>
    </Box>
  );
}
