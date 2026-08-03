import { authRoutes } from "../features/auth/routes";
import { userRoutes } from "../features/users/routes";
import { jobRoutes } from "../features/jobs/routes";
import { candidateRoutes } from "../features/candidates/routes";
import { interviewRoutes } from "../features/interviews/routes";
import { offerRoutes } from "../features/offers/routes";

export const appRoutes = [
  ...authRoutes,
  ...userRoutes,
  ...jobRoutes,
  ...candidateRoutes,
  ...interviewRoutes,
  ...offerRoutes,
];
