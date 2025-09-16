/**
 * OrganizerModal Component
 * 
 * Modal for creating and editing organizers with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import { Button, TextField } from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import React, { useEffect, useState } from "react";
import { useOrganizerStore } from "../../store/primary_stores/organizerStore";
import useUserRoleStore from "../../store/map_stores/mapUserToRoleStore";

export interface IOrganizerModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  organizerData?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    password: string;
  };
}

export default function OrganizerModal(props: IOrganizerModalProps) {
  const { handleClose, open, mode, organizerData } = props;
  const title = mode === "new" ? "New Organizer" : "Edit Organizer";

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const organizerid = organizerData?.id;
  const { user, getUserByRole } = useUserRoleStore();

  const { createOrganizer, editOrganizer, fetchAllOrganizers, organizerError } =
    useOrganizerStore();

  useEffect(() => {
    if (organizerData) {
      getUserByRole(organizerData.id, 2);
    }
  }, [organizerData, getUserByRole]);

  useEffect(() => {
    if (organizerData && user) {
      setFirstName(organizerData.first_name);
      setLastName(organizerData.last_name);
      setUsername(user.username);
    }
  }, [organizerData, user]);

  const handleCloseModal = () => {
    handleClose();
    setFirstName("");
    setLastName("");
    setUsername("");
  };

  const handleCreateOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createOrganizer({
        first_name: first_name,
        last_name: last_name,
        username: username,
        password: "password",
      });
      await fetchAllOrganizers();
      handleClose();
    } catch (error) {
      console.error("Failed to create organizer: ", error);
    }
  };

  const handleEditOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (organizerid) {
      try {
        await editOrganizer({
          id: organizerid,
          first_name,
          last_name,
          username,
          password: "password",
        });
        await fetchAllOrganizers();
        handleClose();
      } catch (error) {
        console.error("Failed to edit organizer: ", error);
      }
    }
  };

  const buttonText = mode === "new" ? "Create Organizer" : "Update Organizer";

  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "new") {
      handleCreateOrganizer(e);
    } else if (mode === "edit") {
      handleEditOrganizer(e);
    }
  };

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title={title}
      error={organizerError}
    >
      <form
        onSubmit={onSubmitHandler}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TextField
          required
          label="First Name"
          variant="outlined"
          value={first_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFirstName(e.target.value)
          }
          sx={{ mt: 1, width: 300 }}
        />
        <TextField
          required
          label="Last Name"
          variant="outlined"
          value={last_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLastName(e.target.value)
          }
          sx={{ mt: 3, width: 300 }}
        />
        <TextField
          required
          label="Email"
          variant="outlined"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUsername(e.target.value)
          }
          sx={{ mt: 3, width: 300 }}
        />
        {/* Submit button - updated to use modern green success theme */}
        <Button
          type="submit"
          sx={{
            width: 170,
            height: 44,                                    // Consistent height (was 35)
            bgcolor: theme.palette.success.main,          // Green theme (was primary.main)
            "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
            color: "#fff",                                // White text (was secondary.main)
            mt: 4,
            textTransform: "none",                        // No uppercase transformation
            borderRadius: 2,                              // Modern border radius
          }}
        >
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}
