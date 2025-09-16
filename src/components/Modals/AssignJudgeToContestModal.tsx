/**
 * AssignJudgeToContestModal Component
 * 
 * Allows administrators to assign an existing judge to additional contests.
 * This enables the same judge to work on multiple contests simultaneously.
 * 
 * Features:
 * - Select existing judge from dropdown
 * - Select target contest and cluster
 * - Configure which score sheets the judge will handle
 * - Validation to prevent duplicate assignments
 */

import {
  Button,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Box,
  Chip,
  IconButton,
  Typography,
  Alert,
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import { useEffect, useState } from "react";
import { useContestStore } from "../../store/primary_stores/contestStore";
import { useMapClusterToContestStore } from "../../store/map_stores/mapClusterToContestStore";
import { useMapContestJudgeStore } from "../../store/map_stores/mapContestToJudgeStore";
import CloseIcon from "@mui/icons-material/Close";
import { Judge, Contest, Cluster } from "../../types";
import { api } from "../../lib/api";

export interface IAssignJudgeToContestModalProps {
  open: boolean;
  handleClose: () => void;
  onSuccess?: () => void; // Callback when assignment is successful
}

export default function AssignJudgeToContestModal(props: IAssignJudgeToContestModalProps) {
  const { handleClose, open, onSuccess } = props;
  
  // Form state
  const [selectedJudgeId, setSelectedJudgeId] = useState<number>(-1);
  const [selectedContestId, setSelectedContestId] = useState<number>(-1);
  const [selectedClusterId, setSelectedClusterId] = useState<number>(-1);
  const [scoreSheets, setScoreSheets] = useState({
    presentation: false,
    journal: false,
    mdo: false,
    runpenalties: false,
    otherpenalties: false,
    redesign: false,
    championship: false,
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Store hooks
  const { allContests: contests, fetchAllContests: fetchContests } = useContestStore();
  const { clusters, fetchClustersByContestId } = useMapClusterToContestStore();
  const { getAllJudgesByContestId } = useMapContestJudgeStore();
  
  // Local state for judges
  const [allJudges, setAllJudges] = useState<Judge[]>([]);
  
  // Filter clusters based on selected contest
  const availableClusters = clusters.filter(cluster => 
    cluster.contestid === selectedContestId
  );
  
  // Filter judges to exclude those already assigned to selected contest
  const [judgeContestMappings, setJudgeContestMappings] = useState<{[key: number]: number[]}>({});
  
  const availableJudges = allJudges.filter(judge => {
    const assignedContests = judgeContestMappings[judge.id] || [];
    return !assignedContests.includes(selectedContestId);
  });
  
  // Load data when modal opens
  useEffect(() => {
    if (open) {
      fetchContests();
      setError(null);
      setSuccess(null);
    }
  }, [open, fetchContests]);
  
  // Load judges when contests are available
  useEffect(() => {
    if (open && contests.length > 0) {
      loadAllJudges();
    }
  }, [open, contests]);
  
  // Load judge-contest mappings
  useEffect(() => {
    if (open && allJudges.length > 0) {
      loadJudgeContestMappings();
    }
  }, [open, allJudges]);
  
  // Load clusters when contest is selected
  useEffect(() => {
    if (selectedContestId !== -1) {
      fetchClustersByContestId(selectedContestId);
    }
  }, [selectedContestId, fetchClustersByContestId]);
  
  const loadAllJudges = async () => {
    try {
      const allJudgesSet = new Set<Judge>();
      
      // Get judges from each contest
      for (const contest of contests) {
        try {
          await getAllJudgesByContestId(contest.id);
          // The store will be updated, but we need to get the judges from the store
          // For now, let's use a direct API call
          const response = await api.get(`/mapping/judgeToContest/getAllJudges/${contest.id}/`);
          if (response.data.Judges) {
            response.data.Judges.forEach((judge: Judge) => {
              allJudgesSet.add(judge);
            });
          }
        } catch (error) {
          console.error(`Failed to load judges for contest ${contest.id}:`, error);
        }
      }
      
      setAllJudges(Array.from(allJudgesSet));
    } catch (error) {
      console.error('Failed to load judges:', error);
      setError('Failed to load judges');
    }
  };
  
  const loadJudgeContestMappings = async () => {
    const mappings: {[key: number]: number[]} = {};
    
    for (const judge of allJudges) {
      try {
        const response = await api.get(`/mapping/contestToJudge/judge-contests/${judge.id}/`);
        if (response.data.contests) {
          mappings[judge.id] = response.data.contests.map((c: Contest) => c.id);
        }
      } catch (error) {
        console.error(`Failed to load contests for judge ${judge.id}:`, error);
        mappings[judge.id] = [];
      }
    }
    
    setJudgeContestMappings(mappings);
  };
  
  const handleSubmit = async () => {
    if (selectedJudgeId === -1 || selectedContestId === -1 || selectedClusterId === -1) {
      setError("Please select a judge, contest, and cluster");
      return;
    }
    
    // Check if at least one score sheet type is selected
    const hasScoreSheets = Object.values(scoreSheets).some(Boolean);
    if (!hasScoreSheets) {
      setError("Please select at least one score sheet type");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const payload = {
        judge_id: selectedJudgeId,
        contest_id: selectedContestId,
        cluster_id: selectedClusterId,
        ...scoreSheets
      };
      
      const response = await api.post('/mapping/contestToJudge/assign/', payload);
      
      setSuccess(response.data.message || "Judge successfully assigned to contest!");
      
      // Refresh judge-contest mappings
      await loadJudgeContestMappings();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setSelectedJudgeId(-1);
      setSelectedContestId(-1);
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
      
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to assign judge to contest");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseModal = () => {
    setError(null);
    setSuccess(null);
    handleClose();
  };
  
  return (
    <Modal open={open} handleClose={handleCloseModal} title="Assign Judge to Contest" error={error}>
      <Container sx={{ p: 3, minWidth: 500 }}>
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Judge Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Judge</InputLabel>
          <Select
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(Number(e.target.value))}
            label="Select Judge"
          >
            <MenuItem value={-1}>
              <em>Choose a judge...</em>
            </MenuItem>
            {availableJudges.map((judge) => (
              <MenuItem key={judge.id} value={judge.id}>
                {judge.first_name} {judge.last_name}
                {judgeContestMappings[judge.id] && judgeContestMappings[judge.id].length > 0 && (
                  <Chip 
                    label={`${judgeContestMappings[judge.id].length} contest(s)`} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Judges already assigned to the selected contest are not shown
          </FormHelperText>
        </FormControl>
        
        {/* Contest Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Contest</InputLabel>
          <Select
            value={selectedContestId}
            onChange={(e) => {
              setSelectedContestId(Number(e.target.value));
              setSelectedClusterId(-1); // Reset cluster when contest changes
            }}
            label="Select Contest"
          >
            <MenuItem value={-1}>
              <em>Choose a contest...</em>
            </MenuItem>
            {contests.map((contest) => (
              <MenuItem key={contest.id} value={contest.id}>
                {contest.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Cluster Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Cluster</InputLabel>
          <Select
            value={selectedClusterId}
            onChange={(e) => setSelectedClusterId(Number(e.target.value))}
            label="Select Cluster"
            disabled={selectedContestId === -1}
          >
            <MenuItem value={-1}>
              <em>Choose a cluster...</em>
            </MenuItem>
            {availableClusters.map((cluster) => (
              <MenuItem key={cluster.id} value={cluster.id}>
                {cluster.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Only clusters from the selected contest are shown
          </FormHelperText>
        </FormControl>
        
        {/* Score Sheet Types */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Score Sheet Types
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select which types of score sheets this judge will handle:
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              { key: "presentation", label: "Presentation" },
              { key: "journal", label: "Journal" },
              { key: "mdo", label: "Machine Design" },
              { key: "runpenalties", label: "Run Penalties" },
              { key: "otherpenalties", label: "Other Penalties" },
              { key: "redesign", label: "Redesign" },
              { key: "championship", label: "Championship" },
            ].map(({ key, label }) => (
              <Box key={key} sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={scoreSheets[key as keyof typeof scoreSheets]}
                  onChange={(e) => setScoreSheets(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                />
                <Typography variant="body2">{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            disabled={isSubmitting}
            sx={{
              borderColor: theme.palette.grey[400],
              color: theme.palette.grey[600],
              "&:hover": {
                borderColor: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[50],
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            {isSubmitting ? "Assigning..." : "Assign Judge"}
          </Button>
        </Box>
      </Container>
    </Modal>
  );
}
