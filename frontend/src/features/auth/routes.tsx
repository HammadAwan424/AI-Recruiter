import React from "react";
import { LoginPage } from "./screens/LoginPage";
import { SignupPage } from "./screens/SignupPage";

export const authRoutes = [
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
];
