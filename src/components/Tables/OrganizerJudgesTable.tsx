import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button, Container, CircularProgress } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import JudgeModal from "../Modals/JudgeModal";
import { useNavigate } from "react-router-dom";
import { useMapClusterJudgeStore } from "../../store/map_stores/mapClusterToJudgeStore";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ClusterModal from "../Modals/ClusterModal";
import { Cluster, Judge, JudgeData } from "../../types";
import AreYouSureModal from "../Modals/AreYouSureModal";

interface IJudgesTableProps {
  judges: any[];
  clusters: any[];
  contestid: number;
}

interface IOrganizerClustersTeamsTableProps {
  clusters: any[];
  judgesByClusterId: {
    [key: number]: Judge[];
  };
  contestid: number;
}

function createDataJudge(
  name: string,
  role: string,
  editJudge: any,
  cluster: string,
  scoreSheets: any[],
  viewEditScores: any,
  deleteJudge: any,
  isAllSheetsSubmited: boolean
) {
  return {
    name,
    role,
    editJudge,
    cluster,
    scoreSheets,
    viewEditScores,
    deleteJudge,
    isAllSheetsSubmited,
  };
}

function JudgeRow(props: { row: ReturnType<typeof createDataJudge> }) {
  const { row } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow
        sx={{
          mt: 0,
          "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
          "&:hover": { backgroundColor: "rgba(0,0,0,0.02)" },
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ width: 56 }}>
          <IconButton size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
          {row.role}
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
          {row.name}
        </TableCell>
        <TableCell scope="row" sx={{ width: 56 }}>
          {row.isAllSheetsSubmited ? (
            <CheckIcon sx={{ color: "#1e7e34" }} />
          ) : (
            <CloseIcon sx={{ color: "#d32f2f" }} />
          )}
        </TableCell>
        <TableCell align="right">
          <Container
            sx={{
              paddingBottom: 0,
              paddingTop: 0,
              p: 0,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {row.viewEditScores}
            {row.editJudge}
            {row.deleteJudge}
          </Container>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small" sx={{ "& .MuiTableCell-root": { py: 1 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: 180, color: "text.secondary" }}>
                    Cluster(s)
                  </TableCell>
                  <TableCell align="left">{row.cluster}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ width: 180, color: "text.secondary" }}>
                    Score Sheets
                  </TableCell>
                  <TableCell align="left">
                    {row.scoreSheets.map((value, index) => (
                      <Typography
                        key={index}
                        component="span"
                        style={{ display: "inline" }}
                      >
                        {value}
                        {index < row.scoreSheets.length - 1 ? ", " : ""}
                      </Typography>
                    ))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function JudgesTable(props: IJudgesTableProps) {
  const { judges, clusters, contestid } = props;
  const navigate = useNavigate();
  const [openJudgeModal, setOpenJudgeModal] = useState(false);
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [judgeData, setJudgeData] = useState<JudgeData | undefined>(undefined);
  const { submissionStatus, checkAllScoreSheetsSubmitted } = useJudgeStore();
  const [judgeId, setJudgeId] = useState(0);
  const { fetchJudgesByClusterId } = useMapClusterJudgeStore();

  const { judgeClusters } = useMapClusterJudgeStore();
  const { deleteJudge, judgeError } = useJudgeStore();

  const titles = ["Lead", "Technical", "General", "Journal"];

  // Ensure we compute the all-submitted status for each judge when data changes
  React.useEffect(() => {
    if (judges && judges.length > 0) {
      checkAllScoreSheetsSubmitted(judges as any);
    }
    
  }, [judges]);

  const handleOpenJudgeModal = (judgeData: JudgeData) => {
    setJudgeData(judgeData);
    setOpenJudgeModal(true);
  };

  const handleOpenAreYouSure = (judgeId: number) => {
    setJudgeId(judgeId);
    setOpenAreYouSure(true);
  };

  const handleDelete = async (judgeId: number) => {
    // Unassign judge from THIS contest only (do not delete judge globally)
    const token = localStorage.getItem("token");
    await axios.delete(`/api/mapping/contestToJudge/remove/${judgeId}/${contestid}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    // Refresh judges for all clusters in this contest to reflect removal
    if (clusters && clusters.length > 0) {
      for (const c of clusters) {
        await fetchJudgesByClusterId(c.id);
      }
    }
  };

  const handleCloseJudgeModal = () => {
    setOpenJudgeModal(false);
  };

  const getScoreSheets = (judge: any) => {
    const scoreSheets = [];
    if (judge.journal) scoreSheets.push("Journal");
    if (judge.presentation) scoreSheets.push("Presentation");
    if (judge.mdo) scoreSheets.push("Machine Design & Operation");
    if (judge.otherpenalties) scoreSheets.push("General Penalties");
    if (judge.runpenalties) scoreSheets.push("Run Penalties");

    return scoreSheets;
  };

  // Populate table with store data
  const rows = judges.map((judge) =>
    createDataJudge(
      `${judge.first_name} ${judge.last_name}`,
      `${titles[judge.role - 1]}`,
      <Button
        variant="outlined"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenJudgeModal({
            id: judge.id,
            firstName: judge.first_name,
            lastName: judge.last_name,
            cluster: judgeClusters[judge.id],
            role: judge.role,
            journalSS: judge.journal,
            presSS: judge.presentation,
            mdoSS: judge.mdo,
            runPenSS: judge.runpenalties,
            genPenSS: judge.otherpenalties,
            redesignSS: false,
            championshipSS: false,
            phoneNumber: judge.phone_number,
          });
        }}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          px: 2.25,
          py: 0.75,
          borderRadius: 1.5,
        }}
      >
        Edit Judge
      </Button>,
      judgeClusters[judge.id]?.cluster_name,
      getScoreSheets(judge),
      <Button
        variant="outlined"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/judging/${judge.id}/`);
        }}
        sx={{
          mr: 2,
          textTransform: "none",
          fontWeight: 600,
          px: 2.25,
          py: 0.75,
          borderRadius: 1.5,
        }}
      >
        View/Edit Scores
      </Button>,
      <Button
        variant="outlined"
        sx={{
          ml: 2,
          textTransform: "none",
          fontWeight: 600,
          px: 2.25,
          py: 0.75,
          borderRadius: 1.5,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenAreYouSure(judge.id);
        }}
      >
        Delete
      </Button>,
      submissionStatus ? submissionStatus[judge.id] : false
    )
  );

  return (
    <TableContainer component={Box}>
      <Table
        sx={{
          minWidth: 650,
          "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
        }}
      >
        <TableBody>
          {rows.map((row, index) => (
            <JudgeRow key={index} row={row} />
          ))}
        </TableBody>
      </Table>
      <JudgeModal
        open={openJudgeModal}
        handleClose={handleCloseJudgeModal}
        mode="edit"
        clusters={clusters}
        judgeData={judgeData}
        contestid={contestid}
      />
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to delete this judge?"
        handleSubmit={() => handleDelete(judgeId)}
        error={judgeError}
      />
    </TableContainer>
  );
}

export default function OrganizerJudgesTable(
  props: IOrganizerClustersTeamsTableProps
) {
  const { clusters, judgesByClusterId, contestid } = props;
  const [openClusterIds, setOpenClusterIds] = useState<number[]>([]);
  const [openClusterModal, setOpenClusterModal] = useState(false);
  const [clusterData, setClusterData] = useState<Cluster | undefined>(
    undefined
  );

  const handleToggleRow = (clusterId: number) => {
    setOpenClusterIds((prevIds) =>
      prevIds.includes(clusterId)
        ? prevIds.filter((id) => id !== clusterId)
        : [...prevIds, clusterId]
    );
  };

  const handleCloseModal = (type: string) => {
    if (type === "cluster") {
      setOpenClusterModal(false);
    }
  };

  const handleOpenModal = (type: string, clusterData: Cluster) => {
    if (type === "cluster") {
      setOpenClusterModal(true);
      setClusterData(clusterData);
    }
  };

  return judgesByClusterId ? (
    <TableContainer component={Box}>
      <Table
        sx={{
          "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
        }}
      >
        <TableBody>
          {clusters.map((cluster) => (
            <React.Fragment key={cluster.id}>
              <TableRow
                onClick={() => handleToggleRow(cluster.id)}
                sx={{
                  bgcolor:
                    cluster.cluster_name === "All Teams"
                      ? "#f4fbf6"
                      : "transparent",
                }}
              >
                <TableCell sx={{ width: 56 }}>
                  <IconButton size="small">
                    {openClusterIds.includes(cluster.id) ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: 700 }}
                >
                  {cluster.cluster_name}
                </TableCell>
                <TableCell align="right">
                  {cluster.cluster_name != "All Teams" && (
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal("cluster", {
                          cluster_name: cluster.cluster_name,
                          id: cluster.id,
                        });
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2.25,
                        py: 0.75,
                        borderRadius: 1.5,
                      }}
                    >
                      Edit Cluster
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                  colSpan={5}
                >
                  <Collapse
                    in={openClusterIds.includes(cluster.id)}
                    timeout="auto"
                    unmountOnExit
                  >
                    {judgesByClusterId[cluster.id] && (
                      <JudgesTable
                        judges={judgesByClusterId[cluster.id]}
                        clusters={clusters}
                        contestid={contestid}
                      />
                    )}
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <ClusterModal
        open={openClusterModal}
        handleClose={() => handleCloseModal("cluster")}
        mode="edit"
        clusterData={clusterData}
      />
    </TableContainer>
  ) : (
    <CircularProgress />
  );
}