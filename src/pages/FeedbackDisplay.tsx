import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import theme from "../theme";

interface FeedbackComment {
  scoresheet_id: number;
  comment: string;
  sheet_type: number;
  sheet_type_name: string;
  judge_name: string;
  judge_id: number;
  team_name: string;
  team_id: number;
}

export default function FeedbackDisplay() {
  const { teamId, contestId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;
  const navigate = useNavigate();
  
  const [feedbackData, setFeedbackData] = useState<FeedbackComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!parsedTeamId || !parsedContestId) {
        setError("Missing team ID or contest ID");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/tabulation/getScoresheetCommentsByTeamId/?teamid=${parsedTeamId}&contestid=${parsedContestId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Feedback data received:", data);
        
        // Extract comments from the response
        const comments: FeedbackComment[] = [];
        if (data.Comments) {
          Object.entries(data.Comments).forEach(([category, commentList]: [string, any]) => {
            if (Array.isArray(commentList) && commentList.length > 0) {
              commentList.forEach((comment: string, index: number) => {
                if (comment && comment.trim() !== "") {
                  comments.push({
                    scoresheet_id: 0, // We don't have this in the current response
                    comment: comment,
                    sheet_type: getSheetTypeFromCategory(category),
                    sheet_type_name: getSheetTypeName(category),
                    judge_name: "Judge", // We don't have judge names in the current response
                    judge_id: 0,
                    team_name: "Team", // We don't have team name in the current response
                    team_id: parsedTeamId,
                  });
                }
              });
            }
          });
        }
        
        setFeedbackData(comments);
      } catch (error: any) {
        setError(error.message || "Error fetching feedback data");
        console.error("Error fetching feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [parsedTeamId, parsedContestId]);

  const getSheetTypeFromCategory = (category: string): number => {
    switch (category) {
      case "presentation_comments":
        return 1;
      case "journal_comments":
        return 2;
      case "machinedesign_comments":
        return 3;
      case "redesign_comments":
        return 6;
      case "championship_comments":
        return 7;
      case "penalty_comments":
        return 4;
      default:
        return 0;
    }
  };

  const getSheetTypeName = (category: string): string => {
    switch (category) {
      case "presentation_comments":
        return "Presentation";
      case "journal_comments":
        return "Journal";
      case "machinedesign_comments":
        return "Machine Design";
      case "redesign_comments":
        return "Redesign";
      case "championship_comments":
        return "Championship";
      case "penalty_comments":
        return "Penalties";
      default:
        return "Unknown";
    }
  };

  const getSheetTypeColor = (sheetType: number) => {
    switch (sheetType) {
      case 1:
        return theme.palette.info.main; // Blue
      case 2:
        return theme.palette.warning.main; // Orange
      case 3:
        return theme.palette.success.main; // Green
      case 4:
        return theme.palette.error.main; // Red
      case 6:
        return theme.palette.secondary.main; // Purple
      case 7:
        return theme.palette.primary.main; // Dark Blue
      default:
        return theme.palette.grey[500];
    }
  };

  const groupedFeedback = feedbackData.reduce((acc, feedback) => {
    if (!acc[feedback.sheet_type_name]) {
      acc[feedback.sheet_type_name] = [];
    }
    acc[feedback.sheet_type_name].push(feedback);
    return acc;
  }, {} as Record<string, FeedbackComment[]>);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (feedbackData.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            No Feedback Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are no feedback comments available for this team in this contest.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 1,
          }}
        >
          Judge Feedback
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selected feedback comments from judges for this team
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Feedback by Category */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {Object.entries(groupedFeedback).map(([categoryName, comments]) => (
          <Card key={categoryName} elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: getSheetTypeColor(comments[0].sheet_type),
                  mb: 2,
                }}
              >
                {categoryName} Feedback
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {comments.map((feedback, index) => (
                  <Paper
                    key={index}
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.grey[50],
                      borderLeft: `4px solid ${getSheetTypeColor(feedback.sheet_type)}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {feedback.comment}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Back Button */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography
          onClick={() => navigate(-1)}
          sx={{
            cursor: "pointer",
            color: theme.palette.primary.main,
            textDecoration: "underline",
            "&:hover": {
              color: theme.palette.primary.dark,
            },
          }}
        >
          ← Back to Results
        </Typography>
      </Box>
    </Container>
  );
}
