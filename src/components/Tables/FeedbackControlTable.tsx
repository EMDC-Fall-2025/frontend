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
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import useFeedbackControlStore, { FeedbackDisplaySettings } from "../../store/primary_stores/feedbackControlStore";
import useContestStore from "../../store/primary_stores/contestStore";
import theme from "../../theme";

export default function FeedbackControlTable() {
  const {
    settings,
    currentSettings,
    isLoading,
    error,
    getAllSettings,
    getSettingsForContest,
    createSettings,
    updateSettings,
    clearError,
  } = useFeedbackControlStore();

  const { allContests, fetchAllContests } = useContestStore();

  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [localSettings, setLocalSettings] = useState<Partial<FeedbackDisplaySettings>>({});

  useEffect(() => {
    fetchAllContests();
    getAllSettings();
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      getSettingsForContest(selectedContestId as number);
    }
  }, [selectedContestId]);

  useEffect(() => {
    if (currentSettings) {
      setLocalSettings(currentSettings);
    } else if (selectedContestId) {
      // Set default values if no settings exist
      setLocalSettings({
        contestid: selectedContestId as number,
        show_presentation_comments: true,
        show_journal_comments: true,
        show_machinedesign_comments: true,
        show_redesign_comments: true,
        show_championship_comments: true,
        show_penalty_comments: false,
      });
    }
  }, [currentSettings, selectedContestId]);

  const handleCheckboxChange = (field: keyof FeedbackDisplaySettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    if (!selectedContestId) return;

    clearError();
    
    const settingsToSave = {
      ...localSettings,
      contestid: selectedContestId as number,
    } as FeedbackDisplaySettings;

    try {
      if (currentSettings) {
        await updateSettings(settingsToSave);
      } else {
        await createSettings(settingsToSave);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleRefresh = () => {
    if (selectedContestId) {
      getSettingsForContest(selectedContestId as number);
    }
  };

  const feedbackTypes = [
    {
      key: "show_presentation_comments" as keyof FeedbackDisplaySettings,
      label: "Presentation Comments",
      description: "Feedback from judges on team presentations"
    },
    {
      key: "show_journal_comments" as keyof FeedbackDisplaySettings,
      label: "Journal Comments", 
      description: "Feedback from judges on team journals"
    },
    {
      key: "show_machinedesign_comments" as keyof FeedbackDisplaySettings,
      label: "Machine Design Comments",
      description: "Feedback from judges on machine design"
    },
    {
      key: "show_redesign_comments" as keyof FeedbackDisplaySettings,
      label: "Redesign Comments",
      description: "Feedback from judges on redesign rounds"
    },
    {
      key: "show_championship_comments" as keyof FeedbackDisplaySettings,
      label: "Championship Comments",
      description: "Feedback from judges on championship rounds"
    },
    {
      key: "show_penalty_comments" as keyof FeedbackDisplaySettings,
      label: "Penalty Comments",
      description: "Feedback from judges on penalties (usually hidden)"
    }
  ];

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Feedback Display Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control which types of judge feedback are displayed to teams in results
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
                    Save Settings
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Settings Panel */}
        {selectedContestId && !isLoading && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Feedback Display Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Toggle which types of judge feedback are visible to teams when results are published
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {feedbackTypes.map((feedbackType) => (
                  <Grid item xs={12} sm={6} key={feedbackType.key}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={localSettings[feedbackType.key] || false}
                              onChange={() => handleCheckboxChange(feedbackType.key)}
                              color="success"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {feedbackType.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {feedbackType.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Status Indicator */}
              {currentSettings && (
                <Box mt={3} p={2} bgcolor="rgba(46,125,50,0.1)" borderRadius={1}>
                  <Typography variant="body2" color="success.dark">
                    ✓ Settings saved for this contest
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!selectedContestId && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                How to Use
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Select a contest from the dropdown above<br/>
                2. Toggle the feedback types you want to show/hide<br/>
                3. Click "Save Settings" to apply changes<br/>
                4. Teams will only see feedback for enabled types when results are published
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
