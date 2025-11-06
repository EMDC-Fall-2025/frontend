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
import { useState } from "react";
import JudgeModal from "../Modals/JudgeModal";
import { useNavigate } from "react-router-dom";
import { useMapClusterJudgeStore } from "../../store/map_stores/mapClusterToJudgeStore";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import useContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import toast from "react-hot-toast";
import ClusterModal from "../Modals/ClusterModal";
import { Cluster, Judge, JudgeData } from "../../types";
import AreYouSureModal from "../Modals/AreYouSureModal";

interface IJudgesTableProps {
  judges: any[];
  clusters: any[];
  contestid: number;
  currentCluster?: Cluster;
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
              gap: { xs: 0.5, sm: 1, md: 1.5 },
              flexWrap: { xs: "wrap", sm: "nowrap" },
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
  const { judges, clusters, contestid, currentCluster } = props;
  const navigate = useNavigate();
  const [openJudgeModal, setOpenJudgeModal] = useState(false);
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [judgeData, setJudgeData] = useState<JudgeData | undefined>(undefined);
  const { submissionStatus, checkAllScoreSheetsSubmitted } = useJudgeStore();
  
  // Check submission status for this specific cluster
  React.useEffect(() => {
    if (currentCluster && judges && judges.length > 0) {
      checkAllScoreSheetsSubmitted(judges as any, currentCluster.id);
    }
  }, [currentCluster?.id, judges, checkAllScoreSheetsSubmitted]);
  const [judgeId, setJudgeId] = useState(0);
  const { fetchJudgesByClusterId, removeJudgeFromCluster, fetchClustersForJudges, judgesByClusterId } = useMapClusterJudgeStore();
  const { removeJudgeFromContestStoreIfNoOtherClusters } = useContestJudgeStore();

  const { judgeClusters } = useMapClusterJudgeStore();

  const titles = ["Lead", "Technical", "General", "Journal"];



  React.useEffect(() => {
    if (judges && judges.length > 0) {
      fetchClustersForJudges(judges as any);
    }
  }, [judges, fetchClustersForJudges]);

  const handleOpenJudgeModal = (judgeData: JudgeData) => {
    setJudgeData(judgeData);
    setOpenJudgeModal(true);
  };

  const handleOpenAreYouSure = (judgeId: number) => {
    setJudgeId(judgeId);
    setOpenAreYouSure(true);
  };

  const handleDelete = async (judgeId: number) => {
    try {
      if (!currentCluster) {
        toast.error("Cluster information not available. Please refresh the page and try again.");
        return;
      }
      
      // Remove judge from cluster
      await removeJudgeFromCluster(judgeId, currentCluster.id);
      
      // After removal, check if judge is still in any other clusters in this contest
      if (contestid) {
        const otherClusters = clusters.filter(c => c.id !== currentCluster.id);
        const isInOtherClusters = otherClusters.some(cluster => {
          const judgesInCluster = judgesByClusterId[cluster.id] || [];
          return judgesInCluster.some(j => j.id === judgeId);
        });
        
        // Only remove from contest if judge is not in any other clusters
        if (!isInOtherClusters) {
          removeJudgeFromContestStoreIfNoOtherClusters(judgeId, contestid);
        }
      }
      
      toast.success(`Judge removed from ${currentCluster.cluster_name} cluster successfully!`);
    } catch (error: any) {
      let errorMessage = "Failed to remove judge from cluster. Please try again.";
      if (error?.response?.data?.error) {
        errorMessage = `Failed to remove judge: ${error.response.data.error}`;
      } else if (error?.response?.data?.detail) {
        errorMessage = `Failed to remove judge: ${error.response.data.detail}`;
      } else if (error?.message) {
        errorMessage = `Failed to remove judge: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  };

  const handleCloseJudgeModal = () => {
    setOpenJudgeModal(false);
  };

  const getScoreSheets = (judge: any) => {
    const scoreSheets: string[] = [];

    // Use the specific cluster row's context if available to avoid stale mappings
    const clusterType = (currentCluster?.cluster_type || "preliminary").toLowerCase();

    if (clusterType === "redesign") {
      scoreSheets.push("Redesign");
      return scoreSheets;
    }

    if (clusterType === "championship") {
      scoreSheets.push("Championship");
      return scoreSheets;
    }

    if (judge.journal) scoreSheets.push("Journal");
    if (judge.presentation) scoreSheets.push("Presentation");
    if (judge.mdo) scoreSheets.push("Machine Design & Operation");
    if (judge.otherpenalties) scoreSheets.push("General Penalties");
    if (judge.runpenalties) scoreSheets.push("Run Penalties");
    return scoreSheets;
  };

  // Check if current cluster is championship or redesign
  const isChampionshipOrRedesignCluster = currentCluster && (
    currentCluster.cluster_type === 'championship' || 
    currentCluster.cluster_name?.toLowerCase().includes('championship') ||
    currentCluster.cluster_type === 'redesign' || 
    currentCluster.cluster_name?.toLowerCase().includes('redesign')
  );

  const rows = judges.map((judge) => {
    // Use composite key to get status for this judge in this specific cluster
    const statusKey = currentCluster ? `${judge.id}-${currentCluster.id}` : `${judge.id}-all`;
    const isSubmitted = submissionStatus ? (submissionStatus[statusKey] ?? false) : false;
    return createDataJudge(
      `${judge.first_name} ${judge.last_name}`,
      `${titles[judge.role - 1]}`,
      isChampionshipOrRedesignCluster ? null : (
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
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 0.6, sm: 0.8, md: 1 },
            borderRadius: 2,
            fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.8rem" },
            minWidth: { xs: "90px", sm: "110px", md: "130px" },
            height: { xs: "32px", sm: "36px", md: "40px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#4caf50",
            color: "white",
            "&:hover": {
              backgroundColor: "#45a049",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 8px rgba(76,175,80,0.25)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Edit Judge
        </Button>
      ),
      // Display the specific cluster name for this row
      currentCluster?.cluster_name || judgeClusters[judge.id]?.cluster_name,
      getScoreSheets(judge),
      <Button
        variant="outlined"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/judging/${judge.id}/`);
        }}
        sx={{
          mr: { xs: 0.5, sm: 1, md: 2 },
          textTransform: "none",
          fontWeight: 600,
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 0.6, sm: 0.8, md: 1 },
          borderRadius: 2,
          fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.8rem" },
          minWidth: { xs: "90px", sm: "110px", md: "130px" },
          height: { xs: "32px", sm: "36px", md: "40px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderColor: "#4caf50",
          color: "#4caf50",
          "&:hover": {
            backgroundColor: "#4caf50",
            color: "white",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(76,175,80,0.25)",
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        View/Edit Scores
      </Button>,
      <Button
        variant="outlined"
        sx={{
          ml: { xs: 0.5, sm: 1, md: 2 },
          textTransform: "none",
          fontWeight: 600,
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 0.6, sm: 0.8, md: 1 },
          borderRadius: 2,
          fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.8rem" },
          minWidth: { xs: "90px", sm: "110px", md: "130px" },
          height: { xs: "32px", sm: "36px", md: "40px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderColor: "#d32f2f",
          color: "#d32f2f",
          "&:hover": {
            backgroundColor: "#d32f2f",
            color: "white",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(211,47,47,0.25)",
          },
          transition: "all 0.2s ease-in-out",
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenAreYouSure(judge.id);
        }}
      >
        Delete
      </Button>,
      isSubmitted
    );
  });

  return (
    <TableContainer component={Box}>
        <Table
          sx={{
            "& .MuiTableCell-root": { 
              fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" }, 
              py: { xs: 0.5, sm: 0.75, md: 1.25 },
              px: { xs: 0.5, sm: 0.75, md: 1 }
            },
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
        onSuccess={async () => {
          // Refresh judges for the current cluster
          if (currentCluster?.id) {
            await fetchJudgesByClusterId(currentCluster.id, true);
          }
          // Also refresh all clusters to handle cluster changes
          if (clusters && clusters.length > 0) {
            await Promise.all(
              clusters.map(cluster => fetchJudgesByClusterId(cluster.id, true))
            );
          }
          handleCloseJudgeModal();
        }}
      />
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to delete this judge?"
        handleSubmit={() => handleDelete(judgeId)}
      />
    </TableContainer>
  );
}

function OrganizerJudgesTable(
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
    <TableContainer 
      component={Box}
      sx={{
        overflowAnchor: "none",
        contain: "layout",
      }}
    >
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
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    overflowAnchor: "none",
                    containIntrinsicSize: "auto",
                  }}
                >
                  <Collapse
                    in={openClusterIds.includes(cluster.id)}
                    timeout="auto"
                    unmountOnExit
                    sx={{
                      willChange: "height",
                      contain: "layout style",
                    }}
                  >
                    <Box 
                      sx={{ 
                        py: 1,
                        isolation: "isolate",
                      }}
                    >
                      {judgesByClusterId[cluster.id] && (
                        <JudgesTable
                          judges={judgesByClusterId[cluster.id]}
                          clusters={clusters}
                          contestid={contestid}
                          currentCluster={cluster}
                        />
                      )}
                    </Box>
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

export default React.memo(OrganizerJudgesTable);