import { LandingPage } from "../pages/landing/LandingPage";
import { createBrowserRouter } from "react-router";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
]);