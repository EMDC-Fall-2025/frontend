import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import Judging from "./pages/Judging";
import Login from "./pages/Login";
import Organizer from "./pages/Organizer";
import SetPassword from "./pages/SetPassword";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import Navbar from "./components/Navbar";
import { useAuthStore } from "./store/primary_stores/authStore";
import Logout from "./pages/Logout";
import ManageContest from "./pages/ManageContest";
import Coach from "./pages/Coach";
import JournalScore from "./pasges/JournalScore";
import PresentationScore from "./pages/PresentationScore";
import MachineDesignScore from "./pages/MachineDesignScore";
import Admin from "./pages/Admin";
import InternalResults from "./pages/InternalResults";
import GeneralPenalties from "./pages/GeneralPenalties";
import ScoreBreakdown from "./pages/ScoreBreakdown";
import RunPenalties from "./pages/RunPenalties";

import AdminSpecialAwardsPage from "./pages/AdminSpecialAwards";
import OrganizerSpecialAwards from "./pages/OrganizerSpecialAwards";
import JudgeSpecialAwards from "./pages/JudgeSpecialAwards";
import RedesignScore from "./pages/RedesignScore";
import MultiTeamPresentationScore from "./pages/PresentationMultiTeamScore"
import MultiTeamJournalScore from "./pages/JournalMultiTeamScore";
import MultiTeamMachineDesignScore from "./pages/MachineDesignMultiTeamScore";
import ChampionshipScore from "./pages/ChampionshipScore";
import ContestScores from "./pages/ContestScores";
import Contests from "./pages/ContestsPage";
/*import MasterScorePage from "./pages/MasterScorePage";*/


import { Toaster } from "react-hot-toast";

function App() {
  const currentLink = useLocation().pathname;
  const { isAuthenticated, role } = useAuthStore();

  return (
    <>
      <ThemeProvider theme={theme}>
        {currentLink !== "/set-password/" &&
          currentLink !== "/forgot-password/" &&
          currentLink !== "/login/" &&
          currentLink !== "/signup/" && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password/" element={<ForgotPassword />} />
          <Route path="/contestresults/:contestId" element={<ContestScores />} />
          {isAuthenticated && role?.user_type != 4 && (
            <Route path="/judging/:judgeId/" element={<Judging />} />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/journal-score/:judgeId/:teamId/"
              element={<JournalScore />}
            />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/presentation-score/:judgeId/:teamId/"
              element={<PresentationScore />}
            />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/machine-score/:judgeId/:teamId/"
              element={<MachineDesignScore />}
            />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/general-penalties/:judgeId/:teamId/"
              element={<GeneralPenalties />}
            />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/run-penalties/:judgeId/:teamId/"
              element={<RunPenalties />}
            />
          )}
          {isAuthenticated && role?.user_type != 4 && (
            <Route
              path="/redesign-score/:judgeId/:teamId/"
              element={<RedesignScore />}
            />
          )}
          {<Route path="/login/" element={<Login />} />}
          {isAuthenticated && (
            <Route
              path="/awards/"
              element={<AdminSpecialAwardsPage />}
            />
          )}
          {/* {<Route path="/awards/" element={<AdminSpecialAwardsPage />} />}  */}

          {isAuthenticated && (
            <Route
              path="/organizerAwards/"
              element={<OrganizerSpecialAwards />}
            />
          )}
          {/* {<Route path="/organizerAwards/" element={<OrganizerSpecialAwards />} />}  */}

          {isAuthenticated && (
            <Route
              path="/championship-score/:judgeId/:contestId/"
              element={<ChampionshipScore />}
            />
          )}

          {isAuthenticated && (
            <Route
              path="/judgeAwards/"
              element={<JudgeSpecialAwards />}
            />
          )}
          {/* {<Route path="/judgeAwards/" element={<JudgeSpecialAwards />} />}  */}


          {<Route path="/contestPage/" element={<Contests />} />}

          {isAuthenticated && (
            <Route
              path="/MultiTeam/"
              element={<MultiTeamPresentationScore />}
            />
          )}
          {/* {<Route path="/MultiTeam/" element={<MultiTeamPresentationScore />} />} */}

          {isAuthenticated && (
            <Route
              path="/multi-team-machinedesign-score/:judgeId/:contestId/"
              element={<MultiTeamMachineDesignScore />}
            />
          )}
          {/* {<Route path="/multi-team-machinedesign-score/:judgeId/:contestId/" element={<MultiTeamMachineDesignScore />} />} */}

          {isAuthenticated && (
            <Route
              path="/multi-team-journal-score/:judgeId/:contestId/"
              element={<MultiTeamJournalScore />}
            />
          )}
          {/* {<Route path="/multi-team-journal-score/:judgeId/:contestId/" element={<MultiTeamJournalScore />} />} */}

          {isAuthenticated && (
            <Route
              path="/multi-team-presentation-score/:judgeId/:contestId/"
              element={<MultiTeamPresentationScore />}
            />
          )}
          {/* {<Route path="/multi-team-presentation-score/:judgeId/:contestId/" element={<MultiTeamPresentationScore />} />} */}
          {isAuthenticated && <Route path="/logout/" element={<Logout />} />}
          {role?.user_type == 2 && (
            <Route path="/organizer/" element={<Organizer />} />
          )}{/*
          {role?.user_type == 2 && (
            <Route path="/master-score/" element={<MasterScorePage />} />
          )}*/}
          {(role?.user_type == 1 || role?.user_type == 2) && (
            <Route path="/results/:contestId" element={<InternalResults />} />
          )}
          <Route path="/set-password/" element={<SetPassword />} />
          {isAuthenticated && (
            <Route
              path="/manage-contest/:contestId/"
              element={<ManageContest />}
            />
          )}
          {role?.user_type == 4 && <Route path="/coach/" element={<Coach />} />}
          {role?.user_type == 1 && <Route path="/admin/" element={<Admin />} />}
          {isAuthenticated && (
            <Route
              path="/score-breakdown/:teamId"
              element={<ScoreBreakdown />}
            />
          )}
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #00a353',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 163, 83, 0.15)',
              fontFamily: 'Open Sans, sans-serif',
              fontSize: '16px',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              style: {
                background: '#e8eddb',
                color: '#00a353',
                border: '1px solid #00a353',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 163, 83, 0.2)',
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#fff5f5',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '16px',
                fontWeight: '500',
              },
            },
          }}
        />
      </ThemeProvider>
    </>
  );
}

export default App;
