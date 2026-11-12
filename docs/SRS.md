# Opsentra Business OS

## Software Requirements Specification (SRS)

**Version:** 0.1
**Status:** Draft
**Project:** Opsentra Business OS

### 1. Introduction

#### 1.1 Purpose

This document defines the functional and non-functional requirements of Opsentra Business OS. It serves as a reference for development, testing, and future enhancements.

#### 1.2 Project Overview

Opsentra Business OS is a web-based application for managing projects, tracking tasks, and monitoring project progress.

The application provides a centralized workspace where users can organize project information, manage their work, and collaborate with team members.

#### 1.3 Scope

The current scope covers user authentication, project management, task tracking, and dashboard reporting.

Team collaboration and role-based permissions are also part of the product scope. Their current implementation will be reviewed before the requirements are finalized.

#### 1.4 Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT with HTTP-only cookies
- **Testing:** Vitest, React Testing Library, Node.js Test Runner, Supertest
- **CI/CD:** GitHub Actions
- **Deployment:** Render

### 2. Functional Requirements

#### FR-01: User Authentication

- Users must be able to register, log in, and log out.
- The system must validate login credentials.
- Protected resources must not be accessible without authentication.
- Authentication tokens must be stored in HTTP-only cookies.

**Verification Status:** Verified through automated
backend integration tests.

**Test Evidence:**

- Test file: `backend/tests/auth.test.js`
- Authentication tests: 6 passed
- Backend test suite: 51 passed, 0 failed
- Verification environment: Local

#### FR-02: Project Management

- Authorized users must be able to create, view, edit, and delete projects.
- Each project must contain a name, client, status, priority, deadline, and budget.
- Users must only be able to access or modify projects for which they have permission.
- The system must support project search and filtering.

**Verification Status:** Core project management
functionality verified through local backend tests.

**Test Evidence:**

- Test file: `backend/tests/project.test.js`
- Project CRUD operations tested.
- Project ownership and access control tested.
- Search, filtering, sorting, and pagination tested.
- Input validation tested.
- Backend test suite: 51 passed, 0 failed.
- Further frontend and security review: Pending.

#### FR-03: Task Management

- Authorized users must be able to create and manage tasks within a project.
- Tasks must be associated with their parent project.
- Task access must follow the project's authorization rules.

**Verification Status:** Core task management
functionality verified through local backend tests.

**Test Evidence:**

- Test file: `backend/tests/task.test.js`
- Task creation, retrieval, updates, and deletion tested.
- Project ownership and role-based access tested.
- Backend test suite: 51 passed, 0 failed.
- Further UI and security review: Pending.

#### FR-04: Dashboard Reporting

- The system must provide a dashboard for authenticated users.
- The dashboard must display project statistics,
  including active, completed, high-priority,
  and overdue projects.
- Users must only see statistics derived from
  projects they are authorized to access.
- The dashboard must provide an overview
  of recent project activity.

**Verification Criteria:**

- Dashboard statistics match the underlying
  project data.
- Users cannot view another user's private
  project statistics.
- Dashboard calculations are covered by
  automated tests.

**Verification Status:** Core dashboard API behavior
verified through local backend tests.

**Test Evidence:**

- Test file: `backend/tests/dashboard.test.js`
- Authentication requirements tested.
- User-specific project statistics tested.
- Shared and private project visibility tested.
- Further dashboard UI and statistics review: Pending.

#### FR-05: Team Collaboration and Permissions

- Project owners must be able to add and remove
  team members.
- Authorized users must be able to view project
  members and their assigned roles.
- Role-based permissions must control which
  project actions members can perform.
- Unauthorized users must not be able to modify
  project membership.

**Verification Criteria:**

- Project membership operations are covered
  by automated tests.
- Unauthorized membership changes are rejected.
- Role permissions are enforced by the backend.

**Verification Status:** Core project membership
and role-based permissions verified through
local backend integration tests.

**Test Evidence:**

- Test file: `backend/tests/projectMember.test.js`
- Project owner can add and remove members.
- Project owner can update member roles.
- Editors cannot manage project membership.
- Editors can access shared projects.
- Viewers have restricted task permissions.
- Backend test suite: 51 passed, 0 failed.
- Further frontend and security review: Pending.

### 3. Non-Functional Requirements

#### NFR-01: Security

- Protected API endpoints must reject unauthenticated requests.
- Users must not be able to access or modify projects they do not have permission to manage.
- Authentication tokens must be stored in HTTP-only cookies.
- Sensitive configuration values must be managed through environment variables.

**Verification Criteria:**

- Unauthenticated requests to protected endpoints return HTTP 401.
- Automated tests verify project ownership restrictions.

#### NFR-02: Performance

- API response times must be measured for critical endpoints.
- The application must support paginated project listings.
- Performance targets will be finalized after baseline testing.

**Verification Status:** Pending performance testing.

#### NFR-03: Reliability and Availability

- The API must provide endpoints for health and readiness checks.
- The readiness endpoint must report whether the database connection is available.
- Application errors must be logged to support troubleshooting.
- Service failures must be handled without exposing sensitive information.

**Verification Criteria:**

- `GET /api/health` returns HTTP 200 when the API is running.
- `GET /api/ready` returns HTTP 200 when MongoDB is connected and HTTP 503 when it is not.
- Failure scenarios must be verified through testing.

**Verification Status:** Health and readiness
endpoint behavior verified through local
backend integration tests. Further production
availability testing pending.

#### NFR-04: Maintainability

- Backend responsibilities should remain separated across routes, controllers, models, and middleware.
- Changes to existing functionality must be covered by relevant automated tests.
- Code changes must pass the required CI checks before merging into the main branch.
- API behavior and architectural decisions must be documented when they change.

**Verification Criteria:**

- Frontend and backend automated tests pass.
- GitHub Actions CI checks complete successfully.
- Code changes are reviewed before merging.

#### NFR-05: Usability

- The application must provide clear navigation
  between dashboard, projects, and tasks.
- Forms must display understandable validation
  messages when users enter invalid data.
- The interface must remain usable across
  supported desktop and mobile screen sizes.
- Interactive elements must be accessible
  through keyboard navigation.

**Verification Criteria:**

- Verify navigation and form validation behavior.
- Test layouts at supported screen sizes.
- Perform basic keyboard accessibility testing.

**Verification Status:** Pending usability testing.

#### NFR-06: Scalability

- The backend architecture should support future
  deployment across multiple application instances.
- API endpoints must use pagination where appropriate
  to manage growing data volumes.
- Application scaling decisions must be supported
  by performance and load-testing results.

**Verification Criteria:**

- Test API behavior under increasing request loads.
- Evaluate application behavior with multiple
  backend instances.

**Verification Status:** Pending scalability testing.

#### NFR-07: Observability

- The backend must maintain structured application logs to support debugging and troubleshooting.
- Application logs must not expose passwords, authentication tokens, or other sensitive information.
- Critical API endpoints should be monitored for errors and response times.
- Monitoring and alerting requirements will be refined as the deployment architecture evolves.

**Verification Criteria:**

- Verify that application errors are recorded in structured logs.
- Review logs to ensure sensitive information is not exposed.
- Validate monitoring and alerting after implementation.

**Verification Status:**

- Structured HTTP logging: Verified locally.
- Request response times: Verified in logs.
- Cookie redaction: Verified in sampled logs.
- Monitoring dashboards and alerts: Pending.
- Complete sensitive-data audit: Pending.

### 4. Data Requirements

#### DR-01: User Data

- The system must store user account information.
- User passwords must be stored as secure hashes.

#### DR-02: Project Data

- Each project must have a unique identifier.
- Projects must be associated with their owner.
- Project data must be validated before storage.

#### DR-03: Task Data

- Tasks must be associated with a project.
- Task data must follow the project's access rules.

**Verification Status:** Pending data model review.

### 5. Constraints and Assumptions

#### 5.1 Constraints

- The application uses React, Node.js, Express,
  and MongoDB as its primary technology stack.
- Development should prioritize free or
  low-cost tools and infrastructure.
- Changes must preserve existing functionality
  and pass relevant automated tests.
- Sensitive credentials must not be committed
  to version control.

#### 5.2 Assumptions

- Users have access to a modern web browser
  and an internet connection.
- Project owners are responsible for managing
  project access.
- Cloud infrastructure requirements may
  evolve as application usage increases.
