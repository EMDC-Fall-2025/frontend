import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Divider,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { 
  Save as SaveIcon, 
  Refresh as RefreshIcon, 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import useContestStore from "../../store/primary_stores/contestStore";
import theme from "../../theme";

interface FeedbackItem {
  scoresheet_id: number;
  comment: string;
  sheet_type: number;
  sheet_type_name: string;
  judge_name: string;
  judge_id: number;
  team_name: string;
  team_id: number;
}

interface SelectedFeedbackItem {
  id: number;
  contestid: number;
  scoresheet_id: number;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export default function GranularFeedbackControlTable() {
  const { allContests, fetchAllContests } = useContestStore();
  
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContests();
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      fetchAllFeedback();
      fetchSelectedFeedback();
    }
  }, [selectedContestId]);

  const fetchAllFeedback = async () => {
    if (!selectedContestId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/feedback/all/${selectedContestId}/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAllFeedback(data.feedback || []);
    } catch (error: any) {
      setError(error.message || "Error fetching feedback data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSelectedFeedback = async () => {
    if (!selectedContestId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/feedback/selected/${selectedContestId}/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.selected_feedback)
          ? (data as any).selected_feedback
          : [];
      const selectedIds = new Set(list.map((item: SelectedFeedbackItem) => item.scoresheet_id));
      setSelectedFeedback(selectedIds);
    } catch (error: any) {
      console.error("Error fetching selected feedback:", error);
      // If no selections exist, that's okay - start with empty set
      setSelectedFeedback(new Set());
    }
  };

  const handleFeedbackToggle = (scoresheetId: number) => {
    const newSelected = new Set(selectedFeedback);
    if (newSelected.has(scoresheetId)) {
      newSelected.delete(scoresheetId);
    } else {
      newSelected.add(scoresheetId);
    }
    setSelectedFeedback(newSelected);
  };

  const handleSelectAll = (sheetType: number) => {
    const feedbackForType = allFeedback.filter(item => item.sheet_type === sheetType);
    const newSelected = new Set(selectedFeedback);
    
    const allSelected = feedbackForType.every(item => newSelected.has(item.scoresheet_id));
    
    if (allSelected) {
      // Deselect all
      feedbackForType.forEach(item => newSelected.delete(item.scoresheet_id));
    } else {
      // Select all
      feedbackForType.forEach(item => newSelected.add(item.scoresheet_id));
    }
    
    setSelectedFeedback(newSelected);
  };

  const handleSave = async () => {
    if (!selectedContestId) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/feedback/update-selected/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_id: selectedContestId,
          selected_scoresheet_ids: Array.from(selectedFeedback),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess("Feedback selection updated successfully!");
      // Re-fetch to ensure UI reflects persisted state
      await fetchSelectedFeedback();
    } catch (error: any) {
      setError(error.message || "Error updating feedback selection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedContestId) {
      fetchAllFeedback();
      fetchSelectedFeedback();
    }
  };

  const getSheetTypeColor = (sheetType: number) => {
    const colors = {
      1: theme.palette.primary.main,    // Presentation
      2: theme.palette.secondary.main,  // Journal
      3: theme.palette.success.main,    // Machine Design
      4: theme.palette.warning.main,    // Redesign
      5: theme.palette.info.main,       // Championship
      6: theme.palette.error.main,      // Penalties
    };
    return colors[sheetType as keyof typeof colors] || theme.palette.grey[500];
  };

  const groupFeedbackByType = () => {
    const grouped: { [key: number]: FeedbackItem[] } = {};
    allFeedback.forEach(item => {
      if (!grouped[item.sheet_type]) {
        grouped[item.sheet_type] = [];
      }
      grouped[item.sheet_type].push(item);
    });
    return grouped;
  };

  const groupedFeedback = groupFeedbackByType();

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Granular Feedback Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select specific judge feedback comments to display to teams
          </Typography>
        </Box>

        {/* Contest Selection */}
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Contest</InputLabel>
                  <Select
                    value={selectedContestId}
                    onChange={(e) => setSelectedContestId(e.target.value as number)}
                    label="Select Contest"
                  >
                    {allContests.map((contest) => (
                      <MenuItem key={contest.id} value={contest.id}>
                        {contest.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={!selectedContestId || isLoading}
                    sx={{ textTransform: "none" }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!selectedContestId || isLoading}
                    sx={{ 
                      textTransform: "none",
                      bgcolor: theme.palette.success.main,
                      "&:hover": { bgcolor: theme.palette.success.dark }
                    }}
                  >
                    Save Selection
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Feedback Selection */}
        {selectedContestId && !isLoading && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Select Feedback Comments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose which specific judge feedback comments should be visible to teams
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              {Object.keys(groupedFeedback).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No feedback comments found for this contest
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {Object.entries(groupedFeedback).map(([sheetType, feedback]) => (
                    <Accordion key={sheetType} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip 
                            label={feedback[0].sheet_type_name}
                            size="small"
                            sx={{ 
                              bgcolor: getSheetTypeColor(parseInt(sheetType)),
                              color: "white"
                            }}
                          />
                          <Typography variant="subtitle2">
                            {feedback.length} comment{feedback.length !== 1 ? 's' : ''}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {feedback.every(item => selectedFeedback.has(item.scoresheet_id)) ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <CancelIcon color="error" fontSize="small" />
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box mb={2}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={feedback.every(item => selectedFeedback.has(item.scoresheet_id))}
                                indeterminate={feedback.some(item => selectedFeedback.has(item.scoresheet_id)) && !feedback.every(item => selectedFeedback.has(item.scoresheet_id))}
                                onChange={() => handleSelectAll(parseInt(sheetType))}
                                color="success"
                              />
                            }
                            label="Select All"
                          />
                        </Box>
                        
                        <Grid container spacing={2}>
                          {feedback.map((item) => (
                            <Grid item xs={12} key={item.scoresheet_id}>
                              <Card variant="outlined">
                                <CardContent sx={{ py: 2 }}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={selectedFeedback.has(item.scoresheet_id)}
                                        onChange={() => handleFeedbackToggle(item.scoresheet_id)}
                                        color="success"
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                          {item.team_name} - {item.judge_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                          {item.comment}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!selectedContestId && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                How to Use Granular Feedback Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Select a contest from the dropdown above<br/>
                2. Review all judge feedback comments organized by type<br/>
                3. Check/uncheck individual comments or use "Select All" for each type<br/>
                4. Click "Save Selection" to apply changes<br/>
                5. Only selected comments will be visible to teams in results
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
