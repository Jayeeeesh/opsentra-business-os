# Opsentra Business OS — Cloud Deployment Runbook

- **Document Status:** In Progress
- **Environment:** Development
- **Cloud Provider:** IBM Cloud
- **Deployment Platform:** IBM Cloud Code Engine
- **Last Updated:** November 17, 2026

---

## 1. Overview

This runbook documents the procedures required to build, deploy, verify, and maintain the Opsentra Business OS backend on IBM Cloud.

It serves as a reproducible operational reference for cloud environment setup, container image management, application deployment, troubleshooting, and recovery.

The runbook is maintained alongside the application source code and updated as deployment procedures evolve.

### 1.1 Scope

This document covers:

- IBM Cloud CLI authentication and environment configuration
- Code Engine project management
- Container Registry configuration
- Cross-platform Docker image builds
- Container image publishing
- Backend deployment and configuration
- Operational verification and troubleshooting

Procedures that have not yet been executed are explicitly marked as pending.

## 2. Environment Configuration

| Component             | Configuration              |
| --------------------- | -------------------------- |
| Application           | Opsentra Business OS       |
| Environment           | Development                |
| Cloud Region          | `in-che` (Chennai)         |
| Resource Group        | `Default`                  |
| Code Engine Project   | `opsentra-business-os-dev` |
| Container Registry    | `in.icr.io`                |
| Registry Namespace    | `opsentra-business-os-dev` |
| Registry Pricing Plan | Free                       |
| Target Image Platform | `linux/amd64`              |

### 2.1 Technology Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Containerization:** Docker, Docker Buildx
- **Cloud Platform:** IBM Cloud Code Engine
- **CI/CD:** GitHub Actions

## 3. Prerequisites

Before executing deployment procedures, ensure the following are available:

- IBM Cloud account with appropriate IAM permissions
- IBM Cloud CLI
- Code Engine CLI plugin
- Container Registry CLI plugin
- Docker Desktop with Buildx support
- Access to the Opsentra Business OS repository

All commands are executed from the repository root unless stated otherwise.

## 4. IBM Cloud CLI Configuration

### 4.1 Verify CLI Installation

```bash
ibmcloud --version
```

**Verified version:** `2.49.0`

### 4.2 Authenticate

```bash
ibmcloud login --sso
```

Complete the browser-based authentication flow and select the intended IBM Cloud account.

CLI sessions can expire. Reauthenticate when the CLI reports that the user is not logged in.

### 4.3 Select Region and Resource Group

```bash
ibmcloud target -r in-che
ibmcloud target -g Default
```

Verify the active context:

```bash
ibmcloud target
```

**Expected configuration:**

- Region: `in-che`
- Resource Group: `Default`

## 5. IBM Cloud Code Engine

### 5.1 Verify CLI Plugin

```bash
ibmcloud plugin show code-engine
```

**Verified plugin version:** `1.64.2`

### 5.2 List Existing Projects

```bash
ibmcloud ce project list
```

### 5.3 Development Project

The following project was successfully created:

`opsentra-business-os-dev`

Initial provisioning command:

```bash
ibmcloud ce project create --name opsentra-business-os-dev
```

**Note:** This is a one-time provisioning operation. Do not recreate an existing project during routine deployments.

### 5.4 Verify Project Context

```bash
ibmcloud ce project current
```

If the project is not selected, select it using:

```bash
ibmcloud ce project select --name opsentra-business-os-dev
```

**Verified:** Project created and selected successfully in the Chennai region.

## 6. IBM Cloud Container Registry

### 6.1 Verify CLI Plugin

```bash
ibmcloud plugin show container-registry
```

**Verified plugin version:** `1.4.2`

### 6.2 Verify Pricing Plan

```bash
ibmcloud cr plan
```

**Verified result:** Free pricing plan.

Registry usage must remain within the applicable free-plan limits. Other IBM Cloud services are billed independently.

### 6.3 Verify Registry Region

```bash
ibmcloud cr region
```

**Verified result:**

```text
Region: in-che
Registry: in.icr.io
```

### 6.4 Namespace Configuration

List existing namespaces:

```bash
ibmcloud cr namespace-list
```

The following namespace was successfully provisioned:

`opsentra-business-os-dev`

Initial provisioning command:

```bash
ibmcloud cr namespace-add opsentra-business-os-dev
```

**Note:** Namespace creation is already complete. Subsequent deployments should reuse the existing namespace.

## 7. Docker Image Preparation

### 7.1 Architecture Requirements

The development machine uses Apple Silicon (`arm64`).

The deployment image is built for `linux/amd64` to match the target runtime architecture.

### 7.2 Verify Buildx Support

```bash
docker buildx inspect --bootstrap
```

**Verified:** Docker Buildx supports `linux/amd64`.

### 7.3 Build the Backend Image

```bash
docker buildx build \
  --platform linux/amd64 \
  -t opsentra-business-os-backend:amd64 \
  --load ./backend
```

This command:

1. Uses the backend Dockerfile.
2. Builds the image for Linux AMD64.
3. Applies the `amd64` tag.
4. Loads the completed image into the local Docker image store.

### 7.4 Verify Image Architecture

```bash
docker image inspect \
  opsentra-business-os-backend:amd64 \
  --format '{{.Os}}/{{.Architecture}}'
```

**Verified output:**

```text
linux/amd64
```

**Status:** Local AMD64 image build and architecture verification completed successfully.

**Limitation:** Successful image creation does not independently verify application startup, database connectivity, or cloud runtime behavior.

## 8. Container Image Publishing

**Status: Pending**

The next operational steps are:

1. Authenticate Docker with IBM Cloud Container Registry.
2. Tag the verified AMD64 image with the registry path.
3. Push the image to the configured namespace.
4. Verify the published image and its digest.
5. Confirm the image can be accessed by Code Engine.

The exact publishing commands and verification results will be documented after successful execution.

## 9. Application Deployment

**Status: Pending**

The backend deployment procedure will cover:

- Code Engine application creation
- Container image configuration
- Application listening port (`5001`)
- Runtime environment variables
- Secure database connectivity
- Application readiness and health checks
- Public HTTPS endpoint verification

Deployment commands will be added only after testing against the development environment.

## 10. Security Requirements

The following controls apply to the deployment workflow:

- Do not commit `.env` files or credentials to Git.
- Do not include secrets in container image layers.
- Use appropriate cloud secret management for sensitive configuration.
- Restrict IAM permissions to the minimum required scope.
- Maintain non-root container execution.
- Review application logs for unintended sensitive data exposure.
- Validate authentication and API security after deployment.

The local backend image configuration has previously been verified to exclude the `.env` file and execute as a non-root user. These controls must also be validated in the deployed runtime.

## 11. Cost Management

The current Container Registry pricing plan has been verified as Free.

Code Engine and other cloud services have separate pricing and usage limits.

Before creating billable resources:

1. Review the service pricing and free usage allowances.
2. Confirm account billing status.
3. Configure billing notifications.
4. Avoid unnecessary running resources.
5. Review usage and remove test workloads when no longer needed.

**Billing notifications are not hard spending limits and do not automatically prevent charges.**

## 12. Verification Checklist

| Verification                      | Status   |
| --------------------------------- | -------- |
| IBM Cloud CLI installation        | Complete |
| CLI authentication                | Complete |
| Region selection                  | Complete |
| Resource group targeting          | Complete |
| Code Engine project provisioning  | Complete |
| Container Registry configuration  | Complete |
| AMD64 image build                 | Complete |
| Image architecture verification   | Complete |
| Container Registry authentication | Pending  |
| Image publishing                  | Pending  |
| Application deployment            | Pending  |
| Database connectivity             | Pending  |
| Health and readiness checks       | Pending  |
| End-to-end testing                | Pending  |
| Deployment automation             | Pending  |

## 13. Troubleshooting

### 13.1 IBM Cloud Authentication Expired

**Symptom:**

```text
Not logged in.
```

**Resolution:**

```bash
ibmcloud login --sso
```

Verify account, region, and resource group after authentication.

### 13.2 Docker Daemon Unavailable

**Symptom:**

```text
Cannot connect to the Docker daemon
```

**Resolution:**

Start Docker Desktop and verify that the Docker Engine is running.

```bash
docker info
```

### 13.3 Incorrect Container Architecture

**Symptom:** The local image targets `linux/arm64` instead of the required `linux/amd64`.

**Resolution:** Rebuild using Docker Buildx with the required `--platform` value, then inspect the resulting image.

### 13.4 VS Code CLI Unavailable

**Symptom:**

```text
zsh: command not found: code
```

**Resolution on macOS:**

```bash
open -a "Visual Studio Code" docs/cloud-deployment-runbook.md
```

## 14. Maintenance and Change Management

Update this runbook when:

- Cloud infrastructure configuration changes
- Deployment commands or image build procedures change
- New secrets, services, or dependencies are introduced
- Operational verification procedures change
- A recurring deployment failure requires a documented resolution

Documentation changes should be reviewed through the repository's standard Git branch and pull request workflow.

**Operational principle:** Build → Verify → Publish → Deploy → Validate → Document.

---

## 15. Next Milestone

**Publish the verified AMD64 backend image to IBM Cloud Container Registry.**

The registry authentication, image tagging, push operation, and remote image verification will be documented after completion.
