import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button, CircularProgress } from "@mui/material";
import ClusterModal from "../Modals/ClusterModal";
import { useState } from "react";
import TeamModal from "../Modals/TeamModal";
import { useMapCoachToTeamStore } from "../../store/map_stores/mapCoachToTeamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";
import { Cluster, TeamData } from "../../types";
import DisqualificationModal from "../Modals/DisqualificationModal";

interface IOrganizerTeamsTableProps {
  clusters: any[];
  contestId: number;
}

export default function OrganizerTeamsTable(props: IOrganizerTeamsTableProps) {
  const { clusters, contestId } = props;
  const [openClusterModal, setOpenClusterModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openClusterIds, setOpenClusterIds] = useState<number[]>(
    clusters.length > 0 ? [clusters[0].id] : []
  );
  const [clusterData, setClusterData] = useState<Cluster | undefined>(
    undefined
  );
  const [teamData, setTeamData] = useState<TeamData | undefined>(undefined);
  const { coachesByTeams } = useMapCoachToTeamStore();
  const { teamsByClusterId } = useMapClusterTeamStore();
  const [openDisqualificationModal, setOpenDisqualificationModal] =
    useState(false);
  const [currentTeamName, setCurrentTeamName] = useState("");
  const [currentTeamId, setCurrentTeamId] = useState(0);
  const [currentTeamClusterId, setCurrentTeamClusterId] = useState(0);

  const handleCloseModal = (type: string) => {
    if (type === "cluster") {
      setOpenClusterModal(false);
    } else {
      setOpenTeamModal(false);
    }
  };

  const handleOpenClusterModal = (clusterData: Cluster) => {
    setClusterData(clusterData);
    setOpenClusterModal(true);
  };

  const handleOpenTeamModal = (teamData: TeamData) => {
    setTeamData(teamData);
    setOpenTeamModal(true);
  };

  const handleToggleRow = (clusterId: number) => {
    setOpenClusterIds((prevIds) =>
      prevIds.includes(clusterId)
        ? prevIds.filter((id) => id !== clusterId)
        : [...prevIds, clusterId]
    );
  };

  const handleOpenAreYouSure = (
    teamName: string,
    teamId: number,
    clusterId: number
  ) => {
    setOpenDisqualificationModal(true);
    setCurrentTeamName(teamName);
    setCurrentTeamId(teamId);
    setCurrentTeamClusterId(clusterId);
  };

  function TeamTable({
    teams,
    cluster,
  }: {
    teams: any[] | undefined;
    cluster: number;
  }) {
    return (
      <Table
        sx={{
          minWidth: 650,
          "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 }, // font only
        }}
      >
        <TableBody>
          {teams?.map((team) => (
            <TableRow key={team.id}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                {team.team_name}
              </TableCell>
              {team.judge_disqualified && !team.organizer_disqualified && (
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() =>
                      handleOpenAreYouSure(team.team_name, team.id, cluster)
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.25,
                      py: 0.75,
                      borderRadius: 1.5,
                    }}
                  >
                    Disqualify Team
                  </Button>
                </TableCell>
              )}
              {team.judge_disqualified && team.organizer_disqualified && (
                <TableCell sx={{ color: "red" }}>Disqualified</TableCell>
              )}
              <TableCell align="center">
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleOpenTeamModal({
                      id: team.id,
                      team_name: team.team_name,
                      clusterid: cluster,
                      username: coachesByTeams[team.id]?.username || "N/A",
                      first_name: coachesByTeams[team.id]?.first_name || "N/A",
                      last_name: coachesByTeams[team.id]?.last_name || "N/A",
                      contestid: contestId,
                    })
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2.25,
                    py: 0.75,
                    borderRadius: 1.5,
                  }}
                >
                  Edit Team
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return teamsByClusterId ? (
    <TableContainer component={Box}>
      <Table
        sx={{
          "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 }, // font only
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
                      ? "#f4fbf6" // light green only for All Teams
                      : "transparent",
                }}
              >
                <TableCell>
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
                  sx={{ fontWeight: 700 /* bolder label like dashboard */ }}
                >
                  {cluster.cluster_name}
                </TableCell>
                <TableCell align="right">
                  {cluster.cluster_name != "All Teams" && (
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenClusterModal(cluster);
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
                    {teamsByClusterId[cluster.id] && (
                      <TeamTable
                        teams={teamsByClusterId[cluster.id]}
                        cluster={cluster.id}
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
      <TeamModal
        open={openTeamModal}
        handleClose={() => handleCloseModal("team")}
        mode="edit"
        teamData={teamData}
        clusters={clusters}
        contestId={contestId}
      />
      <DisqualificationModal
        open={openDisqualificationModal}
        handleClose={() => setOpenDisqualificationModal(false)}
        teamName={currentTeamName}
        teamId={currentTeamId}
        clusterId={currentTeamClusterId}
      />
    </TableContainer>
  ) : (
    <CircularProgress />
  );
}
