import React, { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, FormControlLabel, Checkbox } from "@mui/material";

const SettingsPage = () => {
  const [wantsNotifications, setWantsNotifications] = useState(false); // Track whether the user wants notifications
  const [frequency, setFrequency] = useState(""); // Track the frequency of notifications
  const [isSaved, setIsSaved] = useState(false); // Track whether the preferences are saved

  // Load the saved preferences from localStorage when the component mounts
  useEffect(() => {
    const savedNotifications = localStorage.getItem("wantsNotifications");
    const savedFrequency = localStorage.getItem("frequency");

    if (savedNotifications) {
      setWantsNotifications(JSON.parse(savedNotifications)); // Set the user's saved notifications preference
    }

    if (savedFrequency) {
      setFrequency(savedFrequency); // Set the user's saved frequency
    }
  }, []);

  // Handle the change in the notifications preference (Yes/No)
  const handleNotificationChange = (event) => {
    setWantsNotifications(event.target.checked);
  };

  // Handle frequency change
  const handleFrequencyChange = (event) => {
    setFrequency(event.target.value);
  };

  // Handle saving the settings (e.g., updating preferences in localStorage)
  const handleSaveSettings = () => {
    // Save the preferences to localStorage
    localStorage.setItem("wantsNotifications", JSON.stringify(wantsNotifications)); // Save notification preference
    localStorage.setItem("frequency", frequency); // Save frequency preference
    setIsSaved(true); // Indicate that the settings have been saved
    alert("Settings saved successfully!");
  };

  return (
    <Box sx={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={wantsNotifications}
            onChange={handleNotificationChange}
            color="primary"
          />
        }
        label="Do you want to receive notifications?"
      />

      {wantsNotifications && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Notification Frequency</InputLabel>
            <Select
              value={frequency}
              onChange={handleFrequencyChange}
              label="Notification Frequency"
              required
            >
              <MenuItem value="hourly">Every Hour</MenuItem>
              <MenuItem value="daily">Every Day</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </Select>
          </FormControl>

          {frequency && (
            <Typography variant="body1" sx={{ marginTop: "10px" }}>
              You will receive notifications {frequency === "hourly" ? "every hour" : frequency === "daily" ? "every day" : "weekly"}.
            </Typography>
          )}
        </>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveSettings}
        sx={{ marginTop: "20px" }}
      >
        Save Settings
      </Button>

      {isSaved && (
        <Typography sx={{ color: "green", marginTop: "10px" }}>
          Your preferences have been saved.
        </Typography>
      )}
    </Box>
  );
};

export default SettingsPage;
