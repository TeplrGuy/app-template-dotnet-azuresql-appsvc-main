# Quickstart: Deploying Contoso University to Azure

This guide walks through deploying the full application stack (React frontend + NestJS backend) to Azure using the CI/CD pipeline.

## Prerequisites

1. **Azure subscription** with permissions to create resources
2. **Azure AD App Registration** with federated credentials for GitHub Actions OIDC
3. **Terraform state storage** (Azure Storage Account with blob container)
4. **GitHub repository** with Actions enabled

## Step 1: Provision Terraform State Storage

Create the Azure Storage Account for Terraform remote state (one-time setup):

```bash
# Set your prefix (must be globally unique for storage accounts)
PREFIX="contosodemo"

# Create resource group for state storage
az group create --name "${PREFIX}-tfstate-rg" --location eastus2

# Create storage account (name must be alphanumeric, lowercase, globally unique)
az storage account create \
  --name "${PREFIX}tfstate" \
  --resource-group "${PREFIX}-tfstate-rg" \
  --location eastus2 \
  --sku Standard_LRS \
  --encryption-services blob

# Create blob container
az storage container create \
  --name tfstate \
  --account-name "${PREFIX}tfstate"
```

## Step 2: Configure Azure AD Federated Credentials

Create a service principal and configure OIDC for GitHub Actions:

```bash
# Create app registration
APP_ID=$(az ad app create --display-name "contoso-university-github" --query appId -o tsv)

# Create service principal
az ad sp create --id $APP_ID

# Add federated credential for GitHub Actions
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-actions",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:YOUR_ORG/YOUR_REPO:environment:staging",
  "audiences": ["api://AzureADTokenExchange"]
}'

# Assign Contributor role on subscription (or specific RG)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SP_OBJECT_ID=$(az ad sp show --id $APP_ID --query id -o tsv)
az role assignment create \
  --assignee-object-id $SP_OBJECT_ID \
  --role Contributor \
  --scope "/subscriptions/${SUBSCRIPTION_ID}"
```

## Step 3: Configure GitHub Repository Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Value | Required |
|----------|-------|----------|
| `AZURE_CLIENT_ID` | App registration client ID | ✅ |
| `AZURE_TENANT_ID` | Azure AD tenant ID | ✅ |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | ✅ |
| `TF_NAME_PREFIX` | Resource name prefix (e.g., `contosodemo`) | ✅ |
| `AZURE_LOCATION` | Azure region (default: `eastus2`) | ❌ |
| `AAD_ADMIN_LOGIN` | SQL Server AAD admin display name | ❌ |
| `AAD_ADMIN_OBJECT_ID` | SQL Server AAD admin object ID | ❌ |

## Step 4: Configure GitHub Environments

1. Go to **Settings → Environments**
2. Create environment: **staging**
3. Create environment: **production** (optionally add required reviewers for manual approval gate)

### Optional: Manual Approval Gate

To require manual approval before production deployments:

1. Go to **Settings → Environments → production**
2. Click **Add protection rule**
3. Select **Required reviewers**
4. Add one or more team members as required reviewers
5. Save protection rules

When configured, the `cd-prod.yml` workflow will pause after the staging deployment and wait for an approved reviewer to approve before deploying to production.

## Step 5: Deploy to Staging

1. Go to **Actions → CD - Staging (US2)**
2. Click **Run workflow**
3. Leave `image_tag` empty (defaults to latest commit SHA) or enter a specific tag
4. Wait for the pipeline to complete (~10-15 min)

The pipeline will:
1. ✅ Validate required variables
2. ✅ Login to Azure via OIDC
3. ✅ Run `terraform init` with remote state backend
4. ✅ Run `terraform apply` to provision Azure resources
5. ✅ Deploy backend and frontend containers to App Service
6. ✅ Run health checks
7. ✅ Execute Playwright smoke tests
8. ✅ (Optional) Run OWASP ZAP DAST scan

## Step 6: Deploy to Production

1. If configured, approve the production deployment in the GitHub Environment
2. Go to **Actions → CD - Production (US2)**
3. Click **Run workflow**

## Step 7: Verify Deployment

After deployment completes, check the workflow outputs for URLs:

```bash
# Backend API
curl https://<prefix>-staging-api.azurewebsites.net/api

# Frontend
curl https://<prefix>-staging-web.azurewebsites.net/health

# Open in browser
open https://<prefix>-staging-web.azurewebsites.net
```

## Local Development

```bash
# Start SQL Server (Docker Compose)
docker compose up -d

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing required vars" | Configure all required GitHub repository variables (Step 3) |
| Terraform state lock error | Another pipeline run may be in progress; wait or break the lock |
| ACR push denied | Ensure service principal has AcrPush role on the ACR resource |
| Container not starting | Check App Service logs: `az webapp log tail --name <app> --resource-group <rg>` |
| SPA routes return 404 | Verify `nginx.conf` is copied in frontend Dockerfile |
| SQL connection error | Backend falls back to seeded data; check `SQLSERVER_CONNECTION_STRING` app setting |
