# Architecture & Design Guidelines (DESIGN.md)

This document defines the project's absolute architectural standards and provides concrete rules for designing, structuring, and organizing frontend feature modules, components, routes, and screens. The goal of this architecture is to maximize co-location, prevent cross-feature coupling, simplify maintenance, and enable rapid troubleshooting.

---

## 1. Feature-Driven Architectural Pillars

We strictly enforce four core architectural principles:

1. **Feature Co-Location (`src/features/<feature>/`)**:
   * All screens, components, custom hooks, API calls, routes, and permission constants belonging to a specific feature reside **co-located together within that feature's directory**.
   * Layer-based scattering across top-level `/screens`, `/hooks`, `/components` directories is prohibited. Everything owned by a feature travels together.

2. **Dumb Router Aggregator (`src/app/router.tsx`)**:
   * The global router is a dumb aggregator that imports each feature's `routes.tsx` array and concatenates them.
   * Adding a new feature requires adding a single import line to `src/app/router.tsx`. The router contains zero feature-specific conditional logic.

3. **Thin Shared Layer (`src/shared/`)**:
   * Contains feature-agnostic primitives ONLY (UI base components like `Button`, `Modal`, `Table`, cross-cutting hooks like `usePermission`, `useAuth`, base API fetch client, and `RequirePermission` guards).
   * **Hard Rule**: Features NEVER import from each other directly (e.g. `candidates/` reaching into `jobs/components` is strictly forbidden). If two features require the same resource, promote it to `src/shared/`.

4. **Explicit Feature Permission Mapping (`permissions.ts`)**:
   * Every feature defines its own `permissions.ts` file containing permission key constants matching backend permission keys (`create_requisition`, `disposition_candidate`, `create_interview`, `take_interview`, `create_offer`, `approve_requisition`, `change_permissions`, `superadmin`).
   * This provides an audit point to verify frontend permission checks against backend `get_*_or_403` / `require_permissions` guards.

---

## 2. Directory Structure Blueprint

Below is the standard directory structure mapping:

```
src/
├── app/
│   ├── router.tsx          # Aggregates route arrays from every feature (dumb aggregator)
│   └── providers.tsx       # Root providers (PermissionContext, ThemeProvider, QueryClient)
│
├── shared/                 # Feature-agnostic ONLY
│   ├── components/         # Button, Modal, Table, Input, Card
│   ├── hooks/              # usePermission, useAuth, useTheme
│   ├── api/                # Base HTTP client (auth headers, bearer tokens, error handling)
│   └── guards/             # RequirePermission route guard
│
├── theme/
│   └── theme.ts            # Central theme tokens (Palette, Typography, Spacing)
│
└── features/               # Feature-Driven Modules
    ├── jobs/
    │   ├── routes.tsx       # Feature route array tagged with required permissions
    │   ├── permissions.ts  # JOB_PERMISSIONS = { CREATE: "create_requisition", ... }
    │   ├── api.ts          # Jobs API endpoints (built on shared/api)
    │   ├── hooks/          # useJobs, useJob
    │   ├── components/     # JobCard, JobForm
    │   └── screens/        # CreateJobPage, JobListPage
    │
    ├── candidates/         # Candidate screening & pipeline feature module
    │   ├── routes.tsx
    │   ├── permissions.ts  # CANDIDATE_PERMISSIONS = { REJECT: "disposition_candidate" }
    │   ├── api.ts
    │   ├── hooks/
    │   ├── components/     # CandidateKanban, CandidateScorecard
    │   └── screens/        # CandidatePipelinePage
    │
    ├── interviews/         # Interview scheduling & feedback feature module
    │   ├── routes.tsx
    │   ├── permissions.ts  # INTERVIEW_PERMISSIONS = { CREATE: "create_interview", TAKE: "take_interview" }
    │   ├── api.ts
    │   ├── hooks/
    │   ├── components/     # InterviewCalendar, ScorecardModal
    │   └── screens/        # InterviewSchedulePage
    │
    └── offers/             # Offer management & e-signature feature module
        ├── routes.tsx
        ├── permissions.ts  # OFFER_PERMISSIONS = { CREATE: "create_offer", APPROVE: "approve_requisition" }
        ├── api.ts
        ├── hooks/
        ├── components/     # OfferApprovalCard, ESignatureModal
        └── screens/        # OfferDashboardPage, PublicSignPage
```

---

## 3. Router Binding Mechanism & Feature Routes

Each feature exports its own `routes.tsx` array. `src/app/router.tsx` imports and concatenates them:

```tsx
import { jobRoutes } from "@/features/jobs/routes";
import { candidateRoutes } from "@/features/candidates/routes";
import { interviewRoutes } from "@/features/interviews/routes";
import { offerRoutes } from "@/features/offers/routes";

export const appRoutes = [
  ...jobRoutes,
  ...candidateRoutes,
  ...interviewRoutes,
  ...offerRoutes,
];
```

* **Route Tagging**: Each route object specifies path, component, and the required permission key:
```tsx
import { RequirePermission } from "@/shared/guards/RequirePermission";
import { JOB_PERMISSIONS } from "./permissions";
import { CreateJobPage } from "./screens/CreateJobPage";

export const jobRoutes = [
  {
    path: "/jobs/create",
    element: (
      <RequirePermission permission={JOB_PERMISSIONS.CREATE}>
        <CreateJobPage />
      </RequirePermission>
    ),
  },
];
```

---

## 4. UI Styling Concrete Standards (`styles.ts`)

Define all styled-components in `styles.ts`. You must consume the Material UI theme object; **never hardcode hex codes or typography sizing.**

### 4.1 Semantic Cards & Custom Styled Containers
* **Rule**: Every semantic card, container, surface, pill, badge, avatar, or visual element possessing custom styling (background colors, borders, shadows, radii, typography overrides) **MUST be declared in `styles.ts` separately** using `@mui/material/styled` or `styled(...)`. Do NOT write styling logic or inline styles inside composition markup.

* **Good (Theme Bound & Isolated in `styles.ts`)**:
```typescript
import { Box, styled } from '@mui/material';

export const SemanticCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.bg.surfaceContainerHigh,
  borderRadius: 24,
  padding: theme.spacing(6), // Standardized spacing increments (6 * 4px = 24px)
  color: theme.palette.neutral[900],
  ...theme.typography.bodyLarge400, // Predefined typography styling alias
}));
```

* **Bad (Hardcoded Values or Inline Style Blocks - Strict Reject)**:
```typescript
import { Box, styled } from '@mui/material';

export const FormCard = styled(Box)({
  backgroundColor: '#F5F9FF', // Reject: Hardcoded hex code
  borderRadius: '24px',       // Reject: Hardcoded pixel width
  padding: '24px',            // Reject: Hardcoded pixel padding
  color: '#172138',           // Reject: Hardcoded hex code
  fontSize: '18px',           // Reject: Hardcoded size
  fontWeight: 400,            // Reject: Hardcoded weight
});
```

---

### 4.2 Direct Layout & Alignment via MUI `Stack`
* **Rule**: For layout alignment, flex direction, gap spacing, and child positioning inside composition files (`index.tsx` or `Screen.tsx`), **directly consume `@mui/material` `Stack`** (using standard props like `direction="row"`, `spacing={2}`, `alignItems="center"`, `justifyContent="space-between"`).
* Do NOT create redundant single-property wrapper components in `styles.ts` just to apply flex row/col alignment when MUI `Stack` provides standard flex/spacing props out-of-the-box.

* **Good Composition Example**:
```tsx
import { Stack, Typography } from '@mui/material';
import { SemanticCard } from './styles';

export const CandidateOverviewCard = () => (
  <SemanticCard>
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
      <Typography variant="h6">Candidate Name</Typography>
      <Stack direction="row" spacing={1}>
        {/* Actions */}
      </Stack>
    </Stack>
  </SemanticCard>
);
```

---

## 5. Screen Implementation Sequence

When implementing any feature screen, follow this coding order:

1. **Permissions (`permissions.ts`)**: Define feature permission constants matching backend permission keys.
2. **API & Types (`api.ts`)**: Define API calls built on `shared/api` and local TypeScript interfaces.
3. **Custom Hooks (`hooks/`)**: Extract queries, state machines, and callback actions.
4. **UI Styling (`styles.ts`)**: Define semantic cards and styled components using theme tokens.
5. **Sub-components (`components/`)**: Encapsulate complex UI blocks into sub-directories (`index.tsx` + `styles.ts`).
6. **Screen Composition (`screens/`)**: Wire styling, MUI `Stack` layout structures, hooks, and sub-components into a clean screen representation.
7. **Routes Registration (`routes.tsx`)**: Define route objects tagged with `RequirePermission` guards.

---

## 6. Reverse Search Troubleshooting Blueprint

To isolate and fix any bug or UI mismatch in under 30 seconds:

1. **Locate Feature Module**:
   * Inspect the path (e.g. `/jobs/create` maps directly to `src/features/jobs/`).
2. **Isolate Layout Issues**:
   * Inspect the local `styles.ts` inside the feature's `screens/` or `components/` sub-directory.
3. **Isolate State/API/Logic Issues**:
   * Inspect `features/<feature>/hooks/` or `features/<feature>/api.ts`.
4. **Audit Permissions**:
   * Inspect `features/<feature>/permissions.ts` and verify matching backend `get_*_or_403` / `require_permissions` guards.