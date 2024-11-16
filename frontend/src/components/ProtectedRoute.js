import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ component }) => {
  const { user } = useContext(UserContext);

  // If the user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Otherwise, render the component
  return component;
};

export default ProtectedRoute;
