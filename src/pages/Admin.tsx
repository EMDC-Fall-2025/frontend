// Admin.tsx
import React, { useState } from "react";
import useContestStore from "../store/primary_stores/contestStore";
import useOrganizerStore from "../store/primary_stores/organizerStore";
import { useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Stack,
  Tab,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useNavigate } from "react-router-dom";

import AddIcon from "@mui/icons-material/Add";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";

import theme from "../theme";
import OrganizerModal from "../components/Modals/OrganizerModal";
import ContestModal from "../components/Modals/ContestModal";
import AdminContestTable from "../components/Tables/AdminContestTable";
import AdminOrganizerTable from "../components/Tables/AdminOrganizerTable";

export default function Admin() {
  const [value, setValue] = useState("1");
  const [contestModal, setContestModal] = useState(false);
  const [organizerModal, setOrganizerModal] = useState(false);
  const navigate = useNavigate();

  const { allContests, fetchAllContests, isLoadingContest } = useContestStore();
const { allOrganizers, fetchAllOrganizers, isLoadingOrganizer } = useOrganizerStore();

useEffect(() => {
  if (allContests.length === 0) fetchAllContests();
  if (allOrganizers.length === 0) fetchAllOrganizers();

}, []);


  const handleChange = (_e: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  //display cards at the top for contests and organizers

  
  const StatCard = ({ value, label }: { value: number | string; label: string }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[300]}`,
        backgroundColor: "#fff",
      }}
    >
      <CardContent sx={{ py: 3, px: 4 }}>
     
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: theme.palette.success.dark, lineHeight: 1, mb: 0.5 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
  

  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Title in green */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main}}>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage contests and organizers
          </Typography>
        </Stack>

        {/* Only two stat cards: Contests & Organizers */}
      
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard value={isLoadingContest ? "—" : allContests.length} label="Contests" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard value={isLoadingOrganizer ? "—" : allOrganizers.length} label="Organizers" />
          </Grid>
        </Grid>

  
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }} useFlexGap>
          <Button
            onClick={() => setContestModal(true)}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
            }}
          >
            Create Contest
          </Button>

          <Button
            onClick={() => setOrganizerModal(true)}
            variant="outlined"
            startIcon={<PersonAddAlt1Icon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main,
              "&:hover": {
                borderColor: theme.palette.success.dark,
                backgroundColor: "rgba(46,125,50,0.06)",
              },
            }}
          >
            Create Organizer
          </Button>

          <Button
            onClick={() => navigate("/awards")}
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main,
              "&:hover": {
                borderColor: theme.palette.success.dark,
                backgroundColor: "rgba(46,125,50,0.06)",
              },
            }}
          >
            Create Award
          </Button>
        </Stack>

        {/* Tabs */}
        <TabContext value={value}>
          <Box
            sx={{
              border: `1px solid ${theme.palette.grey[300]}`,
              borderBottom: 0,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              backgroundColor: "#fff",
              px: 2,
            }}
          >
            <TabList
              onChange={handleChange}
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 56 },
                "& .MuiTabs-indicator": { height: 3, backgroundColor: theme.palette.success.main },
              }}
            >
              <Tab
                iconPosition="start"
                icon={<CampaignIcon />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Contests</span>
                    
                  </Stack>
                }
                value="1"
              />
              <Tab iconPosition="start" icon={<GroupIcon />} label="Manage Organizers" value="2" />
            </TabList>
          </Box>

      
          <TabPanel
            value="1"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Contest Management
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <AdminContestTable />
            </Box>
          </TabPanel>

          {/* Organizers */}
          <TabPanel
            value="2"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Manage Organizers
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <AdminOrganizerTable />
            </Box>
          </TabPanel>
        </TabContext>
      </Container>

     
      <OrganizerModal
        open={organizerModal}
        handleClose={() => setOrganizerModal(false)}
        mode={"new"}
      />
      <ContestModal open={contestModal} handleClose={() => setContestModal(false)} mode={"new"} />
    </Box>
  );
}
