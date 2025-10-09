import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import useContestStore from "../../store/primary_stores/contestStore";
import { useNavigate } from "react-router-dom";
import AreYouSureModal from "../Modals/AreYouSureModal";
import ContestModal from "../Modals/ContestModal";
import dayjs from "dayjs";
import useMapContestOrganizerStore from "../../store/map_stores/mapContestToOrganizerStore";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";

function createData(
  id: number,
  name: string,
  date: dayjs.Dayjs,
  is_open: boolean,
  is_tabulated: boolean,
  organizers: any[]
) {
  return { id, name, date, is_open, is_tabulated, organizers };
}

export default function AdminContestTable() {
  const navigate = useNavigate();

  const {
    fetchAllContests,
    allContests,
    deleteContest,
    isLoadingContest
  } = useContestStore();

  const {
    fetchOrganizerNamesByContests,
    organizerNamesByContests,
    isLoadingMapContestOrganizer,
  } = useMapContestOrganizerStore();

  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [contestId, setContestId] = useState(0);
  const [openContestModal, setOpenContestModal] = useState(false);
  const [contestData, setContestData] = useState<any>();

  useEffect(() => {
    fetchAllContests();
  }, [fetchAllContests]);

  useEffect(() => {
    fetchOrganizerNamesByContests();
  }, [allContests]);

  const rows = allContests.map((contest) =>
    createData(
      contest.id,
      contest.name,
      dayjs(contest.date),
      contest.is_open,
      contest.is_tabulated,
      organizerNamesByContests[contest.id]
    )
  );

  const handleOpenEditContest = (contest: any) => {
    setContestData({
      contestid: contest.id,
      name: contest.name,
      date: contest.date,
    });
    setOpenContestModal(true);
  };

  const handleDelete = async (id: number) => {
    await deleteContest(id);
    await fetchAllContests();
  };

  const handleOpenAreYouSure = (id: number) => {
    setContestId(id);
    setOpenAreYouSure(true);
  };

  const loading = isLoadingContest || isLoadingMapContestOrganizer;

  return loading ? (
    <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
      <CircularProgress />
    </Box>
  ) : (
    <TableContainer
      component={Box}
      sx={{
        border: "0px solid",
        borderColor: "grey.300",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                borderBottomColor: "grey.300",
              },
            }}
          >
            <TableCell>Name</TableCell>
            <TableCell>Date</TableCell>
            {/* keep Is Open if you still need it; otherwise you can remove these two lines */}
            <TableCell>Is Open</TableCell>
            <TableCell>Organizers</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{
                "& td": { borderBottomColor: "grey.200" },
              }}
            >
      
              <TableCell sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2} minWidth={0}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: (t) => alpha(t.palette.success.light, 0.5),
                      color: "success.dark",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CampaignIcon fontSize="small" />
                  </Box>

                  <Box minWidth={0}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: "1rem" }}
                      noWrap
                      title={row.name}
                    >
                      {row.name}
                    </Typography>

                
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        {row.date.format("MM-DD-YYYY")}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <GroupIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {row.organizers?.length ?? 0}{" "}
                          {(row.organizers?.length ?? 0) === 1 ? "organizer" : "organizers"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </TableCell>

              {/* DATE*/}
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {row.date.format("MM-DD-YYYY")}
              </TableCell>

              {/* IS OPEN */}
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {row.is_open ? "Yes" : "No"}
              </TableCell>

              {/* ORGANIZERS*/}
              <TableCell sx={{ maxWidth: 420 }}>
                {row.organizers && row.organizers.length !== 0 ? (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {row.organizers.map((org: string, idx: number) => (
                      <Chip
                        key={`${row.id}-org-${idx}`}
                        label={org}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: (t) => alpha(t.palette.success.main, 0.06),
                          color: "success.dark",
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No organizers assigned
                  </Typography>
                )}
              </TableCell>

  
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                  <Button
                    onClick={() => navigate(`/manage-contest/${row.id}/`)}
                    variant="contained"
                    size="medium"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: "success.main",
                      "&:hover": { bgcolor: "success.dark" },
                      px: 3,
                      py: 1,
                      fontSize: "0.9rem",
                      fontWeight: 550,
                    }}
                  >
                    Manage
                  </Button>

                  <Button
                    onClick={() => handleOpenEditContest(row)}
                    variant="outlined"
                    size="medium"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      borderColor: "grey.400",
                      color: "text.primary",
                      "&:hover": { borderColor: "text.primary", bgcolor: "grey.100" },
                      px: 3,
                      py: 1,
                      fontSize: "0.9rem",
                      fontWeight: 550,
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleOpenAreYouSure(row.id)}
                    variant="outlined"
                    color="error"
                    size="medium"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      borderColor: "error.light",
                      "&:hover": {
                        borderColor: "error.main",
                        bgcolor: "rgba(211,47,47,0.06)",
                      },
                      px: 3,
                      py: 1,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to delete this contest?"
        handleSubmit={() => handleDelete(contestId)}
      />

      <ContestModal
        open={openContestModal}
        handleClose={() => setOpenContestModal(false)}
        mode="edit"
        contestData={contestData}
      />
    </TableContainer>
  );
}
