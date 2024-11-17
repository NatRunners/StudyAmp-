import MenuIcon from "@mui/icons-material/Menu";
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
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Global.css";

const drawerWidth = 240;

const navItems = [
  ["Home", "/"],
  ["New Session", "/create"],
  ["Past Sessions", "/view"],
  ["Overview", "/visualize"],
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
                component={Link}
                to={path}
                sx={{
                  color: "#ffffff",
                  textTransform: "none",
                  fontSize: "1.5rem",
                  padding: "8px 20px",
                  margin: "0 5px",
                  fontWeight: 'bold',
                  borderRadius: '15px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#3e8a84',
                    boxShadow: '0 0 20px #3e8a84, 0 0 30px #3e8a84',
                  }
                }}
              >
                {label}
              </Button>
            ))}
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
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: drawerWidth,
            backgroundColor: "rgba(0, 0, 0, 0.9)"
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navigation;