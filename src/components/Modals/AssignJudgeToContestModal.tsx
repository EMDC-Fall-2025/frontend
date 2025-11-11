
/**
 * AssignJudgeToContestModal Component
 *
 * Allows organisers to assign an existing judge to additional contests.
 * This enables the same judge to work on multiple contests simultaneously.
 *
 * Features:
 * - Select existing judge from dropdown
 * - Select target contest and cluster
 * - Configure which score sheets the judge will handle
 * - Validation to prevent duplicate assignments
 */

import * as React from "react";
import {
  Button,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  Box,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import toast from "react-hot-toast";
import { useContestStore } from "../../store/primary_stores/contestStore";
import { Judge } from "../../types";
import axios from "axios";
import SearchBar from "../SearchBar";

export interface IAssignJudgeToContestModalProps {
  open: boolean;
  handleClose: () => void;
  onSuccess?: () => void;
  contestId?: number;
}

export default function AssignJudgeToContestModal(
  props: IAssignJudgeToContestModalProps
) {
  const { handleClose, open, onSuccess, contestId } = props;

  // Get the current contest if contestId is provided
  const { contest, fetchContestById } = useContestStore();

  // ----- Form State Management -----
  const [selectedJudgeId, setSelectedJudgeId] = React.useState<number>(-1);
  const [selectedContestId, setSelectedContestId] = React.useState<number>(-1);
  const [selectedClusterId, setSelectedClusterId] = React.useState<number>(-1);
  
  // Reference to track which contest's clusters have been loaded to prevent duplicate API calls
  const loadedContestIdRef = React.useRef<number>(-1);
  
  // Track which score sheets the judge will be responsible for
  const [scoreSheets, setScoreSheets] = React.useState({
    presentation: false,
    journal: false,
    mdo: false,
    runpenalties: false,
    otherpenalties: false,
    redesign: false,
    championship: false,
  });

  // ----- UI State Management -----
  // Track form submission state and user feedback
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // ----- Judges -----
  const [allJudges, setAllJudges] = React.useState<Judge[]>([]);

  

  // Local state for clusters specific to selected contest
  const [contestClusters, setContestClusters] = React.useState<any[]>([]);
  // Local state for judges 
  const [assignedJudgeClusterPairs, setAssignedJudgeClusterPairs] = React.useState<Set<string>>(new Set());
  
  //# preventing duplicate assignments
  const availableClusters = contestClusters;
  const filteredClusters = React.useMemo(() => {
    if (selectedJudgeId <= 0 || selectedContestId <= 0) {
      return availableClusters;
    }
    return availableClusters.filter((cluster) => {
      const pairKey = `${selectedJudgeId}-${selectedContestId}-${cluster.id}`;
      return !assignedJudgeClusterPairs.has(pairKey);
    });
  }, [availableClusters, selectedJudgeId, selectedContestId, assignedJudgeClusterPairs]);

  // Auto-select the contest when contestId is provided
  React.useEffect(() => {
    if (contestId && contestId > 0) {
      setSelectedContestId(contestId);
    }
  }, [contestId]);

  // Load contest and judges when modal opens
  React.useEffect(() => {
    if (!open || !contestId) return;

    let isMounted = true;
    setError(null);
    setSuccess(null);

    (async () => {
      try {
        // Fetch the contest if not already loaded
        if (!contest || contest.id !== contestId) {
          await fetchContestById(contestId);
        }

        // Load all judges
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "/api/judge/getAll/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!isMounted) return;
        if (response.data?.Judges) {
          setAllJudges(response.data.Judges);
        } else {
          setAllJudges([]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError("Failed to load required data");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [open, contestId, fetchContestById, contest]);

  // Load clusters when a contest is selected
  React.useEffect(() => {
    // cluster validation
    if (selectedContestId === -1 || selectedContestId <= 0) {
    
      setContestClusters([]);
      return;
    }
    
    // Only fetch if we haven't already loaded clusters for this contest
    if (loadedContestIdRef.current !== selectedContestId) {
      // Fetch clusters and assigned judges for this contest
      (async () => {
        try {
          const token = localStorage.getItem("token");
          
          // #Fetch clusters for the selected contest
          const clustersResponse = await axios.get(
            `/api/mapping/clusterToContest/getAllClustersByContest/${selectedContestId}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          // Process clusters response and update state
          if (clustersResponse.data?.Clusters) {
            setContestClusters(clustersResponse.data.Clusters);
          } else {
            setContestClusters([]);
          }
          
          // Fetch assigned judges by cluster to build precise judge–contest–cluster pairs
          const assignedPairs = new Set<string>();
          await Promise.all(
            (clustersResponse.data?.Clusters || []).map(async (cluster: any) => {
              try {
                const judgesByClusterResponse = await axios.get(
                  `/api/mapping/clusterToJudge/getAllJudgesByCluster/${cluster.id}/`,
                  {
                    headers: {
                      Authorization: `Token ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (judgesByClusterResponse.data?.Judges) {
                  judgesByClusterResponse.data.Judges.forEach((judge: any) => {
                    const pairKey = `${judge.id}-${selectedContestId}-${cluster.id}`;
                    assignedPairs.add(pairKey);
                  });
                }
              } catch (error) {
                
              }
            })
          );

          // Update assigned judge–cluster pairs to prevent duplicate assignments
          setAssignedJudgeClusterPairs(assignedPairs);
        } catch (error) {
          // Handle general data fetching errors
          setContestClusters([]);
          setAssignedJudgeClusterPairs(new Set());
        }
      })();
      
      // Mark this contest as loaded to prevent duplicate requests
      loadedContestIdRef.current = selectedContestId;
    }
   
  }, [selectedContestId]);

  /**
   * Handle form submission for judge assignment
   * Validates form data and creates judge-contest-cluster assignment
   */
  const handleSubmit = async () => {
    if (isSubmitting) return; 

    // Validate required selections
    if (selectedJudgeId === -1 || selectedContestId === -1 || selectedClusterId === -1) {
      setError("Please select a judge, contest, and cluster");
      return;
    }

    // Ensure at least one score sheet type is selected
    const hasScoreSheets = Object.values(scoreSheets).some(Boolean);
    if (!hasScoreSheets) {
      setError("Please select at least one score sheet type");
      return;
    }

    // Reset UI state and begin submission
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare assignment payload with judge, contest, cluster, and score sheet preferences
      const payload = {
        judge_id: selectedJudgeId,
        contest_id: selectedContestId,
        cluster_id: selectedClusterId,
        ...scoreSheets,
      };

      // Get authentication token for API request
      const token = localStorage.getItem("token");
      // Validate token and prepare assignment payload
      
      const response = await axios.post(
        "/api/mapping/contestToJudge/assign/",
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(response?.data?.message || "Judge successfully assigned to contest!");

      // Update assigned judge-cluster pairs to include the newly assigned pair
      setAssignedJudgeClusterPairs((prev) => {
        const newSet = new Set(prev);
        const pairKey = `${selectedJudgeId}-${selectedContestId}-${selectedClusterId}`;
        newSet.add(pairKey);
        return newSet;
      });

      onSuccess?.();

      // Reset form 
      setSelectedJudgeId(-1);
      setSelectedContestId(contestId || -1);
      setSelectedClusterId(-1);
      setScoreSheets({
        presentation: false,
        journal: false,
        mdo: false,
        runpenalties: false,
        otherpenalties: false,
        redesign: false,
        championship: false,
      });
      toast.success("Judge assigned to contest successfully!");
      handleClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.detail || "Failed to assign judge to contest";
      
      // Check for preliminary cluster error - don't show toast for this
      if (errorMessage.toLowerCase().includes("preliminary") && 
          errorMessage.toLowerCase().includes("already assigned")) {
        setError(errorMessage);
      } 
      // Check for specific error about no teams in cluster
      else if (errorMessage.toLowerCase().includes("no teams") || 
          (errorMessage.toLowerCase().includes("teams") && errorMessage.toLowerCase().includes("cluster"))) {
        setError("Cannot assign judge: The selected cluster has no teams. Please add teams to the cluster first or select a different cluster.");
        toast.error("Cannot assign judge: The selected cluster has no teams. Please add teams to the cluster first.");
      } else {
        setError(errorMessage);
        toast.error("Failed to assign judge to contest. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setError(null);
    setSuccess(null);
    // Reset form state but preserve contestId if provided
    setSelectedJudgeId(-1);
    setSelectedClusterId(-1);
    setScoreSheets({
      presentation: false,
      journal: false,
      mdo: false,
      runpenalties: false,
      otherpenalties: false,
      redesign: false,
      championship: false,
    });
    // Preserve contestId if provided, otherwise reset
    if (!contestId) {
      setSelectedContestId(-1);
    }
    // Reset the loaded contest ref so clusters refresh when modal is reopened
    loadedContestIdRef.current = -1;
    handleClose();
  };

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title="Assign Judge to Contest"
    >
      <Container sx={{ 
        p: { xs: 2, sm: 3 }, 
        minWidth: { xs: "auto", sm: 500 },
        maxWidth: { xs: "100%", sm: "700px" }
      }}>
        {/* Success/Error Messages */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              "& .MuiAlert-message": {
                fontSize: { xs: "0.875rem", sm: "0.9rem" }
              }
            }}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              "& .MuiAlert-message": {
                fontSize: { xs: "0.875rem", sm: "0.9rem" }
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Section 1: Judge Selection */}
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              color: theme.palette.text.primary
            }}
          >
            Select Judge
          </Typography>
          {allJudges.length > 0 && (
            <SearchBar 
              judges={allJudges} 
              onJudgeSelect={(judge)=> setSelectedJudgeId(judge?.id || -1)}
            />
          )}
        </Box>

        {/* Section 2: Contest & Cluster Selection */}
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              color: theme.palette.text.primary
            }}
          >
            Contest & Cluster
          </Typography>
          
          {/* Contest Display (read-only when contestId is provided) */}
          {contestId ? (
            <FormControl 
              fullWidth 
              sx={{ 
                mb: { xs: 2, sm: 2.5 }
              }} 
              disabled
            >
              <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Contest</InputLabel>
              <Select
                value={selectedContestId}
                label="Contest"
                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
              >
                <MenuItem value={selectedContestId} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  {contest?.name || `Contest ID: ${contestId}`}
                </MenuItem>
              </Select>
            </FormControl>
          ) : (
            <FormControl 
              fullWidth 
              sx={{ 
                mb: { xs: 2, sm: 2.5 }
              }}
            >
              <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Select Contest</InputLabel>
              <Select
                value={selectedContestId}
                label="Select Contest"
                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                onChange={(e) => {
                  const contestId = Number(e.target.value);
                  setSelectedContestId(contestId);
                  setSelectedClusterId(-1);
                }}
              >
                <MenuItem value={-1}>
                  <em>Choose a contest...</em>
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Cluster Selection */}
          <FormControl 
            fullWidth
          >
            <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Select Cluster</InputLabel>
            <Select
              value={selectedClusterId}
              label="Select Cluster"
              disabled={selectedContestId === -1}
              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
              onChange={(e) => {
                const clusterId = Number(e.target.value);
                setSelectedClusterId(clusterId);
                if (clusterId !== -1) {
                  setScoreSheets({
                    presentation: false,
                    journal: false,
                    mdo: false,
                    runpenalties: false,
                    otherpenalties: false,
                    redesign: false,
                    championship: false,
                  });
                }
              }}
            >
              <MenuItem value={-1}>
                <em>Choose a cluster...</em>
              </MenuItem>
              {filteredClusters.map((cluster) => {
                const clusterType = cluster.cluster_type || 
                  (cluster.cluster_name?.toLowerCase().includes('championship') ? 'championship' :
                   cluster.cluster_name?.toLowerCase().includes('redesign') ? 'redesign' : 'preliminary');
                return (
                  <MenuItem key={cluster.id} value={cluster.id} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span>{cluster.cluster_name}</span>
                      <Chip 
                        label={clusterType.charAt(0).toUpperCase() + clusterType.slice(1)}
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: "0.7rem",
                          backgroundColor: 
                            clusterType === 'championship' ? theme.palette.warning.light :
                            clusterType === 'redesign' ? theme.palette.info.light :
                            theme.palette.success.light,
                          color: 
                            clusterType === 'championship' ? theme.palette.warning.dark :
                            clusterType === 'redesign' ? theme.palette.info.dark :
                            theme.palette.success.dark,
                        }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
            <FormHelperText sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, mt: 0.5 }}>
              Only clusters from the selected contest are shown
            </FormHelperText>
          </FormControl>
        </Box>

        {/* Section 3: Score Sheet Types */}
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: { xs: 1, sm: 1.5 },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              color: theme.palette.text.primary
            }}
          >
            Score Sheet Types
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 2, sm: 2.5 },
              fontSize: { xs: "0.8rem", sm: "0.875rem" }
            }}
          >
            Select which types of score sheets this judge will handle:
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.75, sm: 1 } }}>
            {[
              { key: "presentation", label: "Presentation" },
              { key: "journal", label: "Journal" },
              { key: "mdo", label: "Machine Design" },
              { key: "runpenalties", label: "Run Penalties" },
              { key: "otherpenalties", label: "Other Penalties" },
              { key: "redesign", label: "Redesign" },
              { key: "championship", label: "Championship" },
            ].map(({ key, label }) => {
              // Get selected cluster to determine cluster type
              const selectedCluster = contestClusters.find(cluster => cluster.id === selectedClusterId);
              const clusterType = selectedCluster?.cluster_type || 
                (selectedCluster?.cluster_name?.toLowerCase().includes('championship') ? 'championship' :
                 selectedCluster?.cluster_name?.toLowerCase().includes('redesign') ? 'redesign' : 'preliminary');
              
              const isChampionshipCluster = clusterType === 'championship';
              const isRedesignCluster = clusterType === 'redesign';
              const isPreliminaryCluster = clusterType === 'preliminary';
              
              // Determine if this checkbox should be disabled
              let isDisabled = false;
              let disabledReason = "";
              
              if (selectedClusterId === -1) {
                // No cluster selected yet
                isDisabled = false;
              } else if (isChampionshipCluster && key !== "championship") {
                isDisabled = true;
                disabledReason = "Championship clusters can only have Championship scoresheets";
              } else if (isRedesignCluster && key !== "redesign") {
                isDisabled = true;
                disabledReason = "Redesign clusters can only have Redesign scoresheets";
              } else if (isPreliminaryCluster && (key === "redesign" || key === "championship")) {
                isDisabled = true;
                disabledReason = "Preliminary clusters cannot have Redesign or Championship scoresheets";
              }
              
              return (
                <Box 
                  key={key}
                  sx={{ 
                    display: "flex", 
                    alignItems: "flex-start",
                    p: { xs: 0.75, sm: 1 },
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                    "&:hover": !isDisabled ? {
                      backgroundColor: theme.palette.action.hover,
                    } : {},
                  }}
                >
                  <Checkbox
                    checked={scoreSheets[key as keyof typeof scoreSheets]}
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (isDisabled) return;
                      
                      if (e.target.checked) {
                        if (key === "redesign" || key === "championship") {
                          setScoreSheets({
                            presentation: false,
                            journal: false,
                            mdo: false,
                            runpenalties: false,
                            otherpenalties: false,
                            redesign: key === "redesign",
                            championship: key === "championship",
                          });
                        } else {
                          setScoreSheets(prev => ({
                            ...prev,
                            [key]: true,
                            redesign: false,
                            championship: false,
                          }));
                        }
                      } else {
                        setScoreSheets(prev => ({
                          ...prev,
                          [key]: e.target.checked,
                        }));
                      }
                    }}
                    sx={{ 
                      padding: { xs: 0.5, sm: 0.75 },
                      "& .MuiSvgIcon-root": { 
                        fontSize: { xs: "1.25rem", sm: "1.5rem" } 
                      },
                      "&.Mui-disabled": {
                        color: theme.palette.grey[400],
                      },
                      "&.Mui-checked": {
                        color: theme.palette.success.main,
                      }
                    }}
                  />
                  <Box sx={{ flex: 1, ml: { xs: 0.5, sm: 1 } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: "0.875rem", sm: "0.9rem" },
                        fontWeight: 500,
                        color: isDisabled ? theme.palette.grey[500] : theme.palette.text.primary,
                        mb: isDisabled ? 0.5 : 0
                      }}
                    >
                      {label}
                    </Typography>
                    {isDisabled && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: "block", 
                          color: theme.palette.error.main,
                          fontSize: "0.7rem",
                          mt: 0.25
                        }}
                      >
                        {disabledReason}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: "flex", 
          gap: { xs: 1.5, sm: 2 }, 
          justifyContent: { xs: "stretch", sm: "flex-end" },
          flexDirection: { xs: "column", sm: "row" },
          pt: { xs: 1, sm: 1.5 }
        }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleCloseModal}
            disabled={isSubmitting}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 3, sm: 4.5 },
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              borderColor: theme.palette.grey[400],
              color: theme.palette.grey[700],
              backgroundColor: theme.palette.background.paper,
              "&:hover": {
                borderColor: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[50],
              },
              "&:disabled": {
                borderColor: theme.palette.grey[300],
                color: theme.palette.grey[400],
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: { xs: 3, sm: 4.5 },
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              bgcolor: theme.palette.success.main,
              color: "#fff",
              boxShadow: `
                0 4px 12px rgba(76, 175, 80, 0.3),
                0 2px 4px rgba(76, 175, 80, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: theme.palette.success.dark,
                transform: "translateY(-2px)",
                boxShadow: `
                  0 6px 16px rgba(76, 175, 80, 0.4),
                  0 4px 8px rgba(76, 175, 80, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
              },
              "&:active": {
                transform: "translateY(0px)",
                boxShadow: `
                  0 2px 8px rgba(76, 175, 80, 0.3),
                  inset 0 2px 4px rgba(0, 0, 0, 0.1)
                `,
              },
              "&:disabled": {
                bgcolor: theme.palette.grey[300],
                color: theme.palette.grey[500],
                transform: "none",
                boxShadow: "none",
              }
            }}
          >
            {isSubmitting ? "Assigning..." : "Assign Judge"}
          </Button>
        </Box>
      </Container>
    </Modal>
  );
}