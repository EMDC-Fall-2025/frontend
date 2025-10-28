/**
 * JudgeModal Component
 * 
 * Modal for creating and editing judges
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
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import useUserRoleStore from "../../store/map_stores/mapUserToRoleStore";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import useContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import { useMapClusterJudgeStore } from "../../store/map_stores/mapClusterToJudgeStore";
import CloseIcon from "@mui/icons-material/Close";
import { Cluster, JudgeData } from "../../types";

export interface IJudgeModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  contestid?: number;
  clusters?: Cluster[];
  judgeData?: JudgeData;
  onSuccess?: () => void;
}

export default function JudgeModal(props: IJudgeModalProps) {
  const { handleClose, open, mode, judgeData, clusters, contestid, onSuccess } = props;

  // Store hooks for refreshing data
  const { getAllJudgesByContestId } = useContestJudgeStore();
  const { fetchJudgesByClusterId } = useMapClusterJudgeStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [clusterId, setClusterId] = useState<number>(-1);
  const { user, getUserByRole } = useUserRoleStore();
  const { createJudge, editJudge } = useJudgeStore();
  const [scoreSheetsSelectIsOpen, setScoreSheetsSelectIsOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(0);

  const scoringSheetOptions = [
    { label: "Journal", value: "journalSS", isPreliminary: true },
    { label: "Presentation", value: "presSS", isPreliminary: true },
    { label: "Machine Design & Operation", value: "mdoSS", isPreliminary: true },
    { label: "Run Penalties", value: "runPenSS", isPreliminary: true },
    { label: "General Penalties", value: "genPenSS", isPreliminary: true },
    { label: "Redesign", value: "redesignSS", isPreliminary: false },
    { label: "Championship", value: "championshipSS", isPreliminary: false },
  ];

  const titleOptions = [
    { label: "Lead", value: 1 },
    { label: "Technical", value: 2 },
    { label: "General", value: 3 },
    { label: "Journal", value: 4 },
  ];

  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    cluster: false,
    scoreSheets: false,
    titles: false,
  });

  // Get current cluster info for scoresheet filtering
  const currentCluster = clusters?.find(cluster => cluster.id === clusterId);
  const isChampionshipCluster = currentCluster?.cluster_type === 'championship' || 
                               currentCluster?.cluster_name?.toLowerCase().includes('championship');
  const isRedesignCluster = currentCluster?.cluster_type === 'redesign' || 
                            currentCluster?.cluster_name?.toLowerCase().includes('redesign');
  const isPreliminaryCluster = !isChampionshipCluster && !isRedesignCluster;

  // Helper function to determine if a scoresheet option should be disabled
  const isScoresheetDisabled = (option: typeof scoringSheetOptions[0]) => {
    if (isChampionshipCluster) {
      return option.value !== "championshipSS";
    } else if (isRedesignCluster) {
      return option.value !== "redesignSS";
    } else if (isPreliminaryCluster) {
      return !option.isPreliminary;
    }
    return false;
  };

  useEffect(() => {
    if (judgeData) {
      getUserByRole(judgeData.id, 3);
    }
  }, [judgeData, getUserByRole]);

  useEffect(() => {
    if (judgeData) {
      setFirstName(judgeData.firstName || '');
      setLastName(judgeData.lastName || '');
      setEmail(judgeData.firstName ? user?.username || '' : '');
      setClusterId(judgeData.cluster?.id || -1);
      setPhoneNumber(judgeData.phoneNumber || '');
      const initialSheets = scoringSheetOptions
        .filter((option) => judgeData[option.value as keyof typeof judgeData])
        .map((option) => option.value);
      
      
      setSelectedSheets(initialSheets);
      setSelectedTitle(Number(judgeData.role) || 0);
    }
  }, [judgeData, user]);

  const handleCloseModal = () => {
    handleClose();
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setClusterId(-1);
    setSelectedSheets([]);
    setSelectedTitle(0);
    setErrors({ cluster: false, scoreSheets: false, titles: false });
  };

  const validateForm = () => {
    const isClusterInvalid = clusterId === -1;
    const areTitlesInvalid = selectedTitle === 0;
    
    // Validate scoresheet combinations
    const hasPreliminarySheets = selectedSheets.some(sheet => 
      scoringSheetOptions.find(opt => opt.value === sheet)?.isPreliminary
    );
    const hasRedesignSheets = selectedSheets.includes("redesignSS");
    const hasChampionshipSheets = selectedSheets.includes("championshipSS");
    
    let areScoreSheetsInvalid = false;
    
    if (isChampionshipCluster && (hasPreliminarySheets || hasRedesignSheets)) {
      areScoreSheetsInvalid = true;
    } else if (isRedesignCluster && (hasPreliminarySheets || hasChampionshipSheets)) {
      areScoreSheetsInvalid = true;
    } else if (isPreliminaryCluster && (hasRedesignSheets || hasChampionshipSheets)) {
      areScoreSheetsInvalid = true;
    }

    setErrors({
      cluster: isClusterInvalid,
      scoreSheets: areScoreSheetsInvalid,
      titles: areTitlesInvalid,
    });

    return !isClusterInvalid && !areTitlesInvalid && !areScoreSheetsInvalid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === "new") {
      await handleCreateJudge();
    } else {
      await handleEditJudge();
    }
  };

  /**
   * Create a new judge account and assign to contest/cluster
   * Handles form validation, data preparation, and error management
   */
  const handleCreateJudge = async () => {
    if (contestid) {
      try {
        // Prepare judge data with form inputs and score sheet assignments
        const judgeData = {
          first_name: firstName || "n/a",
          last_name: lastName || "",
          phone_number: phoneNumber || "n/a",
          presentation: selectedSheets.includes("presSS"),
          mdo: selectedSheets.includes("mdoSS"),
          journal: selectedSheets.includes("journalSS"),
          runpenalties: selectedSheets.includes("runPenSS"),
          otherpenalties: selectedSheets.includes("genPenSS"),
          redesign: selectedSheets.includes("redesignSS"),
          championship: selectedSheets.includes("championshipSS"),
          username: email,
          password: "password",
          contestid: contestid,
          clusterid: clusterId,
          role: selectedTitle,
        };

        // Create judge account and refresh judge list
        await createJudge(judgeData);
        getAllJudgesByContestId(contestid);

        // Refresh judges for the specific cluster to show the new judge
        if (clusterId !== -1) {
          fetchJudgesByClusterId(clusterId);
        }

        // Call parent component's success callback
        onSuccess?.();

        toast.success("Judge created successfully!");
        handleCloseModal();
      } catch (error: any) {
        // Handle judge creation errors with user-friendly messages
        let errorMessage = "";

        // Extract error message from various possible response structures
        if (error?.response?.data) {
          const data = error.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.error && typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.detail && typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.message && typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.errors && typeof data.errors === 'object') {
            // Handle Django-style error objects
            errorMessage = JSON.stringify(data.errors);
          }
        } else if (error?.message && typeof error.message === 'string') {
          errorMessage = error.message;
        }

        if (errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("username") && errorMessage.toLowerCase().includes("taken")) {
          toast.error("Account already exists in the system");
        } else {
          toast.error("Failed to create judge. Please try again.");
        }
      }
    }
  };

  /**
   * Update existing judge information and score sheet assignments
   * Preserves judge ID while updating all other fields
   * For championship/redesign clusters, only update scoresheets that are appropriate
   */
  const handleEditJudge = async () => {
    if (contestid && judgeData) {
      try {
        // Get the current cluster to determine what scoresheets are appropriate
        const currentCluster = clusters?.find(cluster => cluster.id === clusterId);
        const isChampionshipCluster = currentCluster?.cluster_type === 'championship' || 
                                   currentCluster?.cluster_name?.toLowerCase().includes('championship');
        const isRedesignCluster = currentCluster?.cluster_type === 'redesign' || 
                                currentCluster?.cluster_name?.toLowerCase().includes('redesign');
        
        // Determine if any actual changes were made
        const originalClusterId = judgeData.cluster?.id;
        const clusterChanged = originalClusterId !== clusterId;
        
        // Get original scoresheet assignments from judgeData
        const originalSheets = scoringSheetOptions
          .filter((option) => judgeData[option.value as keyof typeof judgeData])
          .map((option) => option.value);
        
        // Check if scoresheets have changed
        const scoresheetsChanged = JSON.stringify(selectedSheets.sort()) !== JSON.stringify(originalSheets.sort());
        
        // Only apply validation and filtering if there are actual changes
        let allowedSheets = selectedSheets;
        
        if (clusterChanged || scoresheetsChanged) {
          // Changes were made - apply appropriate validation based on cluster type
          if (isChampionshipCluster) {
            // Championship clusters can only have championship scoresheets
            allowedSheets = selectedSheets.filter(sheet => sheet === "championshipSS");
            // If no championship sheet is selected, add it automatically
            if (!allowedSheets.includes("championshipSS")) {
              allowedSheets = ["championshipSS"];
            }
          } else if (isRedesignCluster) {
            // Redesign clusters can only have redesign scoresheets
            allowedSheets = selectedSheets.filter(sheet => sheet === "redesignSS");
            // If no redesign sheet is selected, add it automatically
            if (!allowedSheets.includes("redesignSS")) {
              allowedSheets = ["redesignSS"];
            }
          }
          // For preliminary clusters, keep all selected sheets as-is
        } else {
          // No changes made - preserve existing scoresheet assignments exactly as they were
          allowedSheets = originalSheets;
        }
        

        // Check if any actual changes were made to prevent unnecessary API calls
        const hasActualChanges = clusterChanged || scoresheetsChanged || 
          firstName !== judgeData.firstName ||
          lastName !== judgeData.lastName ||
          phoneNumber !== judgeData.phoneNumber ||
          email !== (user?.username || '') ||
          selectedTitle !== Number(judgeData.role);

        if (!hasActualChanges) {
          toast.success("No changes to update");
          handleCloseModal();
          return;
        }

        // Prepare updated judge data with current form values
        const updatedData = {
          id: judgeData.id,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          presentation: allowedSheets.includes("presSS"),
          mdo: allowedSheets.includes("mdoSS"),
          journal: allowedSheets.includes("journalSS"),
          runpenalties: allowedSheets.includes("runPenSS"),
          otherpenalties: allowedSheets.includes("genPenSS"),
          redesign: allowedSheets.includes("redesignSS"),
          championship: allowedSheets.includes("championshipSS"),
          username: email,
          clusterid: clusterId,
          role: selectedTitle,
        };

        // Update judge
        await editJudge(updatedData);

        toast.success("Judge updated successfully!");
        handleCloseModal();

        // Refresh the judge list after modal closes to prevent UI conflicts
        if (contestid) {
          setTimeout(async () => {
            try {
              // Refresh the main judge store
              await getAllJudgesByContestId(contestid);

              // Also refresh judges for each cluster to update the cluster-specific data
              if (clusters && clusters.length > 0) {
                for (const cluster of clusters) {
                  try {
                    await fetchJudgesByClusterId(cluster.id);
                  } catch (error) {
                    console.error(`Error refreshing judges for cluster ${cluster.id}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error("Error refreshing judges:", error);
            }
          }, 100);
        }
      } catch (error: any) {
        // Handle judge update errors with detailed error information
        console.error("Judge update error:", error);

        let errorMessage = "";
        if (error?.response?.data) {
          const data = error.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.error && typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.detail && typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.message && typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.errors && typeof data.errors === 'object') {
            errorMessage = JSON.stringify(data.errors);
          }
        } else if (error?.message && typeof error.message === 'string') {
          errorMessage = error.message;
        }

        // Show specific error message or generic fallback
        if (errorMessage) {
          toast.error(`Failed to update judge: ${errorMessage}`);
        } else {
          toast.error("Failed to update judge. Please try again.");
        }
      }
    }
  };

  const handleScoringSheetsChange = (event: any) => {
    const value = event.target.value as string[];
    
    // Validate scoresheet combinations to prevent mixing types
    const hasPreliminarySheets = value.some(sheet => 
      scoringSheetOptions.find(opt => opt.value === sheet)?.isPreliminary
    );
    const hasRedesignSheets = value.includes("redesignSS");
    const hasChampionshipSheets = value.includes("championshipSS");
    
    // If adding redesign or championship, clear all preliminary sheets
    if (hasRedesignSheets || hasChampionshipSheets) {
      const nonPreliminarySheets = value.filter(sheet => 
        !scoringSheetOptions.find(opt => opt.value === sheet)?.isPreliminary
      );
      setSelectedSheets(nonPreliminarySheets);
    } else if (hasPreliminarySheets) {
      // If adding preliminary sheets, clear redesign and championship
      const preliminarySheets = value.filter(sheet => 
        scoringSheetOptions.find(opt => opt.value === sheet)?.isPreliminary
      );
      setSelectedSheets(preliminarySheets);
    } else {
      setSelectedSheets(value);
    }
  };

  // Auto-select appropriate scoresheet when cluster changes
  useEffect(() => {
    if (clusterId !== -1) {
      if (isChampionshipCluster) {
        setSelectedSheets(["championshipSS"]);
      } else if (isRedesignCluster) {
        setSelectedSheets(["redesignSS"]);
      }
      // For preliminary clusters, don't auto-select anything
    }
  }, [clusterId, isChampionshipCluster, isRedesignCluster]);

  const handleCloseDropdown = (type: string, e?: any) => {
    e.stopPropagation();
    if (type === "scoresheet") {
      setScoreSheetsSelectIsOpen(false);
    }
  };

  const title = mode === "new" ? "New Judge" : "Edit Judge";
  const buttonText = mode === "new" ? "Create Judge" : "Update Judge";

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title={title}
    >
      <Container sx={{ 
        p: { xs: 2, sm: 3 }, 
        maxWidth: { xs: "100%", sm: "500px" }
      }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          <TextField
            label="First Name"
            variant="outlined"
            sx={{ 
              mt: { xs: 1, sm: 1 }, 
              width: { xs: "100%", sm: 350 },
              "& .MuiInputLabel-root": { fontSize: { xs: "0.9rem", sm: "1rem" } },
              "& .MuiOutlinedInput-input": { fontSize: { xs: "0.9rem", sm: "1rem" } }
            }}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last Name"
            variant="outlined"
            sx={{ 
              mt: { xs: 2, sm: 3 }, 
              width: { xs: "100%", sm: 350 },
              "& .MuiInputLabel-root": { fontSize: { xs: "0.9rem", sm: "1rem" } },
              "& .MuiOutlinedInput-input": { fontSize: { xs: "0.9rem", sm: "1rem" } }
            }}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            required
            label="Email"
            variant="outlined"
            sx={{ 
              mt: { xs: 2, sm: 3 }, 
              width: { xs: "100%", sm: 350 },
              "& .MuiInputLabel-root": { fontSize: { xs: "0.9rem", sm: "1rem" } },
              "& .MuiOutlinedInput-input": { fontSize: { xs: "0.9rem", sm: "1rem" } }
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            sx={{ 
              mt: { xs: 2, sm: 3 }, 
              width: { xs: "100%", sm: 350 },
              "& .MuiInputLabel-root": { fontSize: { xs: "0.9rem", sm: "1rem" } },
              "& .MuiOutlinedInput-input": { fontSize: { xs: "0.9rem", sm: "1rem" } }
            }}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <FormControl
            required
            sx={{
              width: { xs: "100%", sm: 350 },
              mt: { xs: 2, sm: 3 },
            }}
          >
            <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Cluster</InputLabel>
            <Select
              value={clusterId}
              label="Cluster"
              sx={{ 
                textAlign: "left",
                fontSize: { xs: "0.9rem", sm: "1rem" }
              }}
              onChange={(e) => setClusterId(Number(e.target.value))}
            >
              {clusters?.map((clusterItem) => (
                <MenuItem key={clusterItem.id} value={clusterItem.id} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  {clusterItem.cluster_name}
                </MenuItem>
              ))}
            </Select>
            {errors.cluster && (
              <FormHelperText sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Please select a cluster.</FormHelperText>
            )}
          </FormControl>
          {/* Show cluster type info - positioned outside FormControl to prevent overlap */}
          {(isChampionshipCluster || isRedesignCluster) && (
            <Box sx={{ 
              mt: { xs: 2, sm: 3 },
              mb: 2,
              p: 1.5, 
              bgcolor: isChampionshipCluster ? 'success.light' : 'warning.light',
              borderRadius: 1,
              fontSize: '0.875rem',
              color: isChampionshipCluster ? 'success.dark' : 'warning.dark',
              fontWeight: 500,
              border: `1px solid ${isChampionshipCluster ? theme.palette.success.main : theme.palette.warning.main}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              width: { xs: "100%", sm: 350 }
            }}>
              {isChampionshipCluster ? 'Championship Cluster: Only Championship scoresheets are allowed' : 
               'Redesign Cluster: Only Redesign scoresheets are allowed'}
            </Box>
          )}
          
          <FormControl sx={{ 
            mt: { xs: 1, sm: 2 }, 
            width: { xs: "100%", sm: 350 }, 
            position: "relative" 
          }}>
            <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Score Sheets</InputLabel>
            <Select
              multiple
              value={selectedSheets}
              open={scoreSheetsSelectIsOpen}
              onClose={() => setScoreSheetsSelectIsOpen(false)}
              onOpen={() => setScoreSheetsSelectIsOpen(true)}
              onChange={handleScoringSheetsChange}
              input={<OutlinedInput label="Scoring Sheets" sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }} />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.25, sm: 0.5 } }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        scoringSheetOptions.find((o) => o.value === value)
                          ?.label
                      }
                      sx={{ 
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        height: { xs: "24px", sm: "32px" }
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton
                  onClick={(e) => handleCloseDropdown("scoresheet", e)}
                  sx={{
                    color: "rgba(0, 0, 0, 0.54)",
                  }}
                  aria-label="Close dropdown"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              {scoringSheetOptions.map((option) => {
                const isDisabled = isScoresheetDisabled(option);
                let disabledReason = "";
                
                if (isChampionshipCluster && option.value !== "championshipSS") {
                  disabledReason = "Championship clusters can only have Championship scoresheets";
                } else if (isRedesignCluster && option.value !== "redesignSS") {
                  disabledReason = "Redesign clusters can only have Redesign scoresheets";
                } else if (isPreliminaryCluster && !option.isPreliminary) {
                  disabledReason = "Preliminary clusters cannot have Redesign or Championship scoresheets";
                }
                
                return (
                  <MenuItem 
                    key={option.value} 
                    value={option.value} 
                    disabled={isDisabled}
                    sx={{ 
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      opacity: isDisabled ? 0.5 : 1,
                      "&.Mui-disabled": {
                        color: theme.palette.grey[500]
                      }
                    }}
                  >
                    <Checkbox 
                      checked={selectedSheets.includes(option.value)} 
                      disabled={isDisabled}
                      sx={{ 
                        padding: { xs: 0.5, sm: 1 },
                        "& .MuiSvgIcon-root": { 
                          fontSize: { xs: "1.2rem", sm: "1.5rem" } 
                        },
                        "&.Mui-disabled": {
                          color: theme.palette.grey[400]
                        }
                      }}
                    />
                    <ListItemText 
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            color: isDisabled ? theme.palette.grey[500] : "inherit"
                          }}>
                            {option.label}
                          </Typography>
                          {isDisabled && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: "block", 
                                color: theme.palette.error.main,
                                fontSize: "0.75rem",
                                mt: 0.5
                              }}
                            >
                              {disabledReason}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </MenuItem>
                );
              })}
            </Select>
            {errors.scoreSheets && (
              <FormHelperText error sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                {isChampionshipCluster 
                  ? "Championship clusters can only have Championship scoresheets"
                  : isRedesignCluster 
                  ? "Redesign clusters can only have Redesign scoresheets"
                  : "Preliminary clusters cannot have Redesign or Championship scoresheets"
                }
              </FormHelperText>
            )}
            <FormHelperText sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Select one or more scoring sheets</FormHelperText>
          </FormControl>
          <FormControl
            required
            sx={{
              width: { xs: "100%", sm: 350 },
              mt: { xs: 2, sm: 3 },
            }}
          >
            <InputLabel sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Title</InputLabel>
            <Select
              value={selectedTitle}
              label="Title"
              sx={{ 
                textAlign: "left",
                fontSize: { xs: "0.9rem", sm: "1rem" }
              }}
              onChange={(e) => setSelectedTitle(Number(e.target.value))}
            >
              {titleOptions?.map((title) => (
                <MenuItem key={title.value} value={title.value} sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  {title.label}
                </MenuItem>
              ))}
            </Select>
            {errors.titles && (
              <FormHelperText sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>Please select a title.</FormHelperText>
            )}
          </FormControl>

          {/* Submit button */}
          <Button
            type="submit"
            sx={{
              width: { xs: "100%", sm: 130 },
              height: { xs: 40, sm: 44 },
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              mt: { xs: 2, sm: 3 },
              textTransform: "none",
              borderRadius: 2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
            }}
          >
            {buttonText}
          </Button>
        </form>
      </Container>
    </Modal>
  );
}
