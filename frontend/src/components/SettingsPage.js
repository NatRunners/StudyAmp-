import React, { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, FormControlLabel, Checkbox, Slider } from "@mui/material";
import '../styles/SettingsPage.css'; // Import your custom CSS file

const SettingsPage = () => {
  const [wantsNotifications, setWantsNotifications] = useState(false); // Track whether the user wants notifications
  const [frequency, setFrequency] = useState(""); // Track the frequency of notifications
  const [lowAttentionScore, setLowAttentionScore] = useState(50); // Default low attention score is 50
  const [notificationInterval, setNotificationInterval] = useState(1); // Default notification interval (minute)
  const [isSaved, setIsSaved] = useState(false); // Track whether the preferences are saved

  // Load the saved preferences from localStorage when the component mounts
  useEffect(() => {
    const savedNotifications = localStorage.getItem("wantsNotifications");
    const savedFrequency = localStorage.getItem("frequency");
    const savedLowAttentionScore = localStorage.getItem("lowAttentionScore");
    const savedNotificationInterval = localStorage.getItem("notificationInterval");

    if (savedNotifications) {
      setWantsNotifications(JSON.parse(savedNotifications)); // Set the user's saved notifications preference
    }
    if (savedFrequency) {
      setFrequency(savedFrequency); // Set the user's saved frequency
    }
    if (savedLowAttentionScore) {
      setLowAttentionScore(Number(savedLowAttentionScore)); // Set the saved low attention score
    }
    if (savedNotificationInterval) {
      setNotificationInterval(Number(savedNotificationInterval)); // Set the saved notification interval
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

  // Handle low attention score change
  const handleLowAttentionScoreChange = (event, newValue) => {
    setLowAttentionScore(newValue);
  };

  // Handle notification interval change (minute options)
  const handleNotificationIntervalChange = (event) => {
    setNotificationInterval(event.target.value);
  };

  // Handle saving the settings (e.g., updating preferences in localStorage)
  const handleSaveSettings = () => {
    // Save the preferences to localStorage
    localStorage.setItem("wantsNotifications", JSON.stringify(wantsNotifications)); // Save notification preference
    localStorage.setItem("frequency", frequency); // Save frequency preference
    localStorage.setItem("lowAttentionScore", lowAttentionScore); // Save low attention score
    localStorage.setItem("notificationInterval", notificationInterval); // Save notification interval
    setIsSaved(true); // Indicate that the settings have been saved
    alert("Settings saved successfully!");
  };

  return (
    <Box className="settings-section">
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      
      {/* Low Attention Score Settings */}
      <Typography variant="body1" sx={{ marginTop: "20px", maxWidth: 400 }}>
        Set Low Attention Score Threshold (0-100):
      </Typography>
      <Slider
        value={lowAttentionScore}
        onChange={handleLowAttentionScoreChange}
        min={0}
        max={100}
        step={1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}%`}
        sx={{ width: "100%", marginTop: "10px", maxWidth: 400 }}
      />

      {/* Notification Preference */}
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
      
      {/* Frequency Settings */}
      {wantsNotifications && (
        <>
          <FormControl fullWidth margin="normal" sx={{ maxWidth: 400 }}>
            <InputLabel>Notification Frequency</InputLabel>
            <Select
              value={frequency}
              onChange={handleFrequencyChange}
              label="Notification Frequency"
              required
            >
              <MenuItem value="minute">Every Minute</MenuItem>
              <MenuItem value="five-minutes">Every 5 Minutes</MenuItem>
              <MenuItem value="ten-minutes">Every 10 Minutes</MenuItem>
            </Select>
          </FormControl>

          {frequency && (
            <Typography variant="body1" sx={{ marginTop: "10px", maxWidth: 400 }}>
              If your concentration drops below {lowAttentionScore}%, you will receive notifications {frequency === "minute" ? "every minute" : frequency === "five-minutes" ? "every 5 minutes" : "every 10 minutes"}.
            </Typography>
          )}
        </>
      )}


      {/* Save Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveSettings}
        sx={{ marginTop: "20px", maxWidth: 400 }}
      >
        Save Settings
      </Button>

      {/* Success Message */}
      {isSaved && (
        <Typography sx={{ color: "green", marginTop: "10px", maxWidth: 400 }}>
          Your preferences have been saved.
        </Typography>
      )}
    </Box>
  );
};

export default SettingsPage;
