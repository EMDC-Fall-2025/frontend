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
import toast from "react-hot-toast";

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

  const { createOrganizer, editOrganizer } = useOrganizerStore();

  useEffect(() => {
    if (organizerData && organizerData.id) {
      getUserByRole(organizerData.id, 2).catch((error) => {
        // Silently handle 404 - organizer might not have a user mapping yet
        console.warn("Failed to fetch user by role for organizer:", error);
      });
    }
  }, [organizerData, getUserByRole]);

  useEffect(() => {
    if (mode === "new") {
      // Reset fields when creating new organizer
      setFirstName("");
      setLastName("");
      setUsername("");
    } else if (organizerData && user) {
      // Set fields when editing existing organizer
      setFirstName(organizerData.first_name);
      setLastName(organizerData.last_name);
      setUsername(user.username);
    } else if (!organizerData) {
      // Reset fields if no organizer data (safety check)
      setFirstName("");
      setLastName("");
      setUsername("");
    }
  }, [mode, organizerData, user]);

  const handleCloseModal = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    handleClose();
  };

  /**
   * Create a new organizer account with admin privileges
   * Sets default password and creates user role mapping
   */
  const handleCreateOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      // Create organizer with provided information and default password
      await createOrganizer({
        first_name: first_name,
        last_name: last_name,
        username: username,
        password: "password",
      });
      
      // Store updates directly, no fetch needed!
      toast.success("Organizer created successfully!");
      handleCloseModal(); // Use handleCloseModal to reset fields
    } catch (error: any) {
      // Handle organizer creation errors with user-friendly messages
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
        toast.error("Failed to create organizer. Please try again.");
      }
    }
  };

  /**
   * Update existing organizer information
   * Preserves organizer ID while updating personal details and credentials
   */
  const handleEditOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (organizerid) {
      try {
        // Update organizer with current form values
        await editOrganizer({
          id: organizerid,
          first_name,
          last_name,
          username,
          password: "password",
        });
        
        // Store updates directly, no fetch needed!
        toast.success("Organizer updated successfully!");
        handleCloseModal(); // Use handleCloseModal to reset fields
      } catch (error: any) {
        // Handle organizer update errors
        toast.error("Failed to update organizer. Please try again.");
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
            height: 44,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: 4,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}
