
import type React from "react"
import { useState } from "react"
import { Typography, Button, Box, Tab, Container } from "@mui/material"
import { TabPanel, TabContext, TabList } from "@mui/lab"
import { useNavigate } from "react-router-dom"
import theme from "../theme"
import AdminContestTable from "../components/Tables/AdminContestTable"
import OrganizerModal from "../components/Modals/OrganizerModal"
import ContestModal from "../components/Modals/ContestModal"
import AdminOrganizerTable from "../components/Tables/AdminOrganizerTable"

export default function Admin() {
  const [value, setValue] = useState("1")
  const [contestModal, setContestModal] = useState(false)
  const [organizerModal, setOrganizerModal] = useState(false)
  const navigate = useNavigate()

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ m: 5 }}>
        Admin Dashboard
      </Typography>
      <Container
        sx={{
          width: "100vw",
          height: "auto",
          position: "absolute",
          padding: 3,
          bgcolor: `${theme.palette.secondary.light}`,
          ml: 5,
          borderRadius: 5,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setContestModal(true)}
          sx={{
            mb: 2,
            bgcolor: `${theme.palette.secondary.main}`,
            color: `${theme.palette.primary.main}`,
          }}
        >
          Create Contest
        </Button>
        <Button
          variant="contained"
          onClick={() => setOrganizerModal(true)}
          sx={{
            mb: 2,
            bgcolor: `${theme.palette.secondary.main}`,
            color: `${theme.palette.primary.main}`,
            ml: 2,
          }}
        >
          Create Organizer
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate("/awards")}
          sx={{
            mb: 2,
            bgcolor: `${theme.palette.secondary.main}`,
            color: `${theme.palette.primary.main}`,
            ml: 2,
          }}
        >
          Create Award
        </Button>
        <TabContext value={value}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: `${theme.palette.secondary.main}`,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
            }}
          >
            <TabList onChange={handleChange}>
              <Tab label="Contests" value="1" />
              <Tab label="Manage Organizers" value="2" />
            </TabList>
          </Box>
          <TabPanel
            sx={{
              bgcolor: `${theme.palette.secondary.main}`,
              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
            }}
            value="1"
          >
            <AdminContestTable />
          </TabPanel>
          <TabPanel
            sx={{
              bgcolor: `${theme.palette.secondary.main}`,
              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
            }}
            value="2"
          >
            <AdminOrganizerTable />
          </TabPanel>
        </TabContext>
      </Container>
      <OrganizerModal open={organizerModal} handleClose={() => setOrganizerModal(false)} mode={"new"} />
      <ContestModal open={contestModal} handleClose={() => setContestModal(false)} mode={"new"} />
    </Box>
  )
}
