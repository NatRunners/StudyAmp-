import MenuIcon from "@mui/icons-material/Menu";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import { UserContext } from "../context/UserContext";  // Import UserContext for user state

const drawerWidth = 240;

const navItems = [
  ["Home", "/"],
  ["New Session", "/create"],
  ["Past Sessions", "/view"],
  ["VisualizeFocus", "/visualize"],
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { user, logout } = useContext(UserContext);  // Get the logged-in user and logout function from context
  const navigate = useNavigate();  // For navigation after logout

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleScroll = () => {
    const navbar = document.getElementById("navigation");
    if (navbar) {
      const isScrolled = window.scrollY > navbar.clientHeight;
      setScrolled(isScrolled);
    }
  };

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();  // Clear user state
    navigate("/login");  // Redirect to login page
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <p className="mobile-menu-top">
        <MenuIcon /> Menu
      </p>
      <Divider />
      <List>
        {navItems.map(([label, path]) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              sx={{ textAlign: "center" }}
              component={Link}
              to={path}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
        {/* Conditionally render Login/Settings and Logout based on user state */}
        <ListItem disablePadding>
          <ListItemButton
            sx={{ textAlign: "center" }}
            component={Link}
            to={user ? "/settings" : "/login"}
          >
            <ListItemText primary={user ? "Settings" : "Login"} />
          </ListItemButton>
        </ListItem>
        {/* If logged in, show the Logout button */}
        {user && (
          <ListItem disablePadding>
            <ListItemButton
              sx={{ textAlign: "center" }}
              onClick={handleLogout}  // Logout functionality
            >
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        id="navigation"
        component="nav"
        sx={{
          position: "fixed",
          backgroundColor: scrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
          color: "white",
          transition: "background-color 0.3s",
          height: "10%",             
          justifyContent: "center"
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}>
          {navItems.map(([label, path]) => (
              <Button
                key={path}
                sx={{ 
                  color: "#ffffff", 
                  textTransform: "none", 
                  fontSize: "1.5rem",
                  padding: "12px 26px",
                  fontWeight: 'bold',
                  boxShadow: "none"
                }}
                component={Link}
                to={path}
              >
                {label}
              </Button>
            ))}
          </Box>
          {/* Conditionally render the Login/Settings and Logout button in the main navbar */}
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {user ? (
              <>
                <Button
                  sx={{
                    color: "#ffffff",
                    textTransform: "none",
                    fontSize: "1.25rem",
                    padding: "10px 12px",
                  }}
                  component={Link}
                  to="/settings"
                >
                  Settings
                </Button>
                <Button
                  sx={{
                    color: "#ffffff",
                    textTransform: "none",
                    fontSize: "1.25rem",
                    padding: "10px 12px",
                  }}
                  onClick={handleLogout}  // Logout functionality
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                sx={{
                  color: "#ffffff",
                  textTransform: "none",
                  fontSize: "1.25rem",
                  padding: "10px 12px",
                }}
                component={Link}
                to="/login"
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navigation;
