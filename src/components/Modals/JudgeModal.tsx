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
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import { useEffect, useState } from "react";
import useUserRoleStore from "../../store/map_stores/mapUserToRoleStore";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import useContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import CloseIcon from "@mui/icons-material/Close";
import { Cluster, JudgeData } from "../../types";

export interface IJudgeModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  contestid?: number;
  clusters?: Cluster[];
  judgeData?: JudgeData;
}

export default function JudgeModal(props: IJudgeModalProps) {
  const { handleClose, open, mode, judgeData, clusters, contestid } = props;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [clusterId, setClusterId] = useState<number>(-1);
  const { user, getUserByRole } = useUserRoleStore();
  const { createJudge, editJudge, judgeError } = useJudgeStore();
  const { getAllJudgesByContestId } = useContestJudgeStore();
  const [scoreSheetsSelectIsOpen, setScoreSheetsSelectIsOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(0);

  const scoringSheetOptions = [
    { label: "Journal", value: "journalSS" },
    { label: "Presentation", value: "presSS" },
    { label: "Machine Design & Operation", value: "mdoSS" },
    { label: "Run Penalties", value: "runPenSS" },
    { label: "General Penalties", value: "genPenSS" },
    { label: "Redesign", value: "redesignSS" },
    //TODO: undetermined if need two score sheets
    { label: "Championship", value: "championshipSS" },
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

  useEffect(() => {
    if (judgeData) {
      getUserByRole(judgeData.id, 3);
    }
  }, [judgeData, getUserByRole]);

  useEffect(() => {
    if (judgeData && user) {
      setFirstName(judgeData.firstName);
      setLastName(judgeData.lastName);
      setEmail(user.username);
      setClusterId(judgeData.cluster.id);
      setPhoneNumber(judgeData.phoneNumber);
      const initialSheets = scoringSheetOptions
        .filter((option) => judgeData[option.value as keyof typeof judgeData])
        .map((option) => option.value);
      setSelectedSheets(initialSheets);
      setSelectedTitle(judgeData.role);
    }
  }, [user, judgeData]);

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
    //const areScoreSheetsInvalid = selectedSheets.length === 0;
    const areTitlesInvalid = selectedTitle === 0;

    setErrors({
      cluster: isClusterInvalid,
      //scoreSheets: areScoreSheetsInvalid,
      scoreSheets: false,
      titles: areTitlesInvalid,
    });
    //&& !areScoreSheetsInvalid
    return !isClusterInvalid && !areTitlesInvalid;
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

  const handleCreateJudge = async () => {
    if (contestid) {
      try {
        const judgeData = {
          first_name: firstName || "n/a",
          last_name: lastName || "n/a",
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

        await createJudge(judgeData);
        getAllJudgesByContestId(contestid);
        handleCloseModal();
      } catch (error) {
        console.error("Failed to create judge", error);
      }
    }
  };

  const handleEditJudge = async () => {
    if (contestid && judgeData) {
      try {
        const updatedData = {
          id: judgeData.id,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          presentation: selectedSheets.includes("presSS"),
          mdo: selectedSheets.includes("mdoSS"),
          journal: selectedSheets.includes("journalSS"),
          runpenalties: selectedSheets.includes("runPenSS"),
          otherpenalties: selectedSheets.includes("genPenSS"),
          redesign: selectedSheets.includes("redesignSS"),
          championship: selectedSheets.includes("championshipSS"),
          username: email,
          clusterid: clusterId,
          role: selectedTitle,
        };

        await editJudge(updatedData);
        getAllJudgesByContestId(contestid);
        handleCloseModal();
      } catch (error) {
        console.error("Failed to edit judge", error);
      }
    }
  };

  const handleScoringSheetsChange = (event: any) => {
    setSelectedSheets(event.target.value);
  };

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
      error={judgeError}
    >
      <Container>
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
            sx={{ mt: 1, width: 350 }}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last Name"
            variant="outlined"
            sx={{ mt: 3, width: 350 }}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            required
            label="Email"
            variant="outlined"
            sx={{ mt: 3, width: 350 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            sx={{ mt: 3, width: 350 }}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <FormControl
            required
            sx={{
              width: 350,
              mt: 3,
            }}
          >
            <InputLabel>Cluster</InputLabel>
            <Select
              value={clusterId}
              label="Cluster"
              sx={{ textAlign: "left" }}
              onChange={(e) => setClusterId(Number(e.target.value))}
            >
              {clusters?.map((clusterItem) => (
                <MenuItem key={clusterItem.id} value={clusterItem.id}>
                  {clusterItem.cluster_name}
                </MenuItem>
              ))}
            </Select>
            {errors.cluster && (
              <FormHelperText>Please select a cluster.</FormHelperText>
            )}
          </FormControl>
          <FormControl sx={{ mt: 3, width: 350, position: "relative" }}>
            <InputLabel>Score Sheets</InputLabel>
            <Select
              multiple
              value={selectedSheets}
              open={scoreSheetsSelectIsOpen}
              onClose={() => setScoreSheetsSelectIsOpen(false)}
              onOpen={() => setScoreSheetsSelectIsOpen(true)}
              onChange={handleScoringSheetsChange}
              input={<OutlinedInput label="Scoring Sheets" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        scoringSheetOptions.find((o) => o.value === value)
                          ?.label
                      }
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
              {scoringSheetOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={selectedSheets.includes(option.value)} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
            {errors.scoreSheets && (
              <FormHelperText error>
                Please select at least one scoring sheet.
              </FormHelperText>
            )}
            <FormHelperText>Select one or more scoring sheets</FormHelperText>
          </FormControl>
          <FormControl
            required
            sx={{
              width: 350,
              mt: 3,
            }}
          >
            <InputLabel>Title</InputLabel>
            <Select
              value={selectedTitle}
              label="Title"
              sx={{ textAlign: "left" }}
              onChange={(e) => setSelectedTitle(Number(e.target.value))}
            >
              {titleOptions?.map((title) => (
                <MenuItem key={title.value} value={title.value}>
                  {title.label}
                </MenuItem>
              ))}
            </Select>
            {errors.titles && (
              <FormHelperText>Please select a title.</FormHelperText>
            )}
          </FormControl>

          <Button
            type="submit"
            sx={{
              width: 130,
              height: 35,
              bgcolor: `${theme.palette.primary.main}`,
              color: `${theme.palette.secondary.main}`,
              mt: 3,
            }}
          >
            {buttonText}
          </Button>
        </form>
      </Container>
    </Modal>
  );
}
