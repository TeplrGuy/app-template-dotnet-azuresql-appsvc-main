// =============================================================================
// Contoso University - Main Infrastructure Template
// =============================================================================
// This template deploys all required Azure resources:
// - Key Vault (for secrets management)
// - App Service Plan
// - Web App (MVC frontend) with Managed Identity
// - API App (Web API backend) with Managed Identity  
// - SQL Server with Database (supports SQL auth or Azure AD-only)
// - Application Insights
// - Log Analytics Workspace
// - Azure Load Testing resource
// 
// Authentication Modes:
// - 'sql': SQL authentication with app user (deployment script creates user)
// - 'aad': Azure AD-only authentication (MCAPS compliant)
// =============================================================================

targetScope = 'subscription'

@minLength(1)
@maxLength(20)
@description('Name of the environment (used as prefix for all resources)')
param environmentName string

@description('Primary location for all resources')
param location string

@description('Name of the web application')
param webServiceName string = '${environmentName}-app'

@description('Name of the API application')
param apiServiceName string = '${environmentName}-api'

@description('SQL authentication mode: sql = SQL auth with app user, aad = Azure AD only')
@allowed(['sql', 'aad'])
param sqlAuthMode string = 'aad'

// SQL Authentication parameters (only used when sqlAuthMode = 'sql')
@description('SQL Server admin username (only for SQL auth mode)')
param sqlAdminUsername string = 'sqladmin'

@secure()
@description('SQL Server admin password (only for SQL auth mode)')
param sqlAdminPassword string = ''

@secure()
@description('SQL App user password (only for SQL auth mode)')
param sqlAppUserPassword string = ''

@description('SQL App username for application connections (only for SQL auth mode)')
param sqlAppUser string = 'appUser'

// Azure AD Authentication parameters (only used when sqlAuthMode = 'aad')
@description('Azure AD SQL Admin display name (only for AAD auth mode)')
param sqlAadAdminName string = ''

@description('Azure AD SQL Admin Object ID (only for AAD auth mode)')
param sqlAadAdminObjectId string = ''

@description('Key name for SQL connection string in Key Vault')
param sqlConnectionStringKey string = 'AZURE-SQL-CONNECTION-STRING'

@description('Deploy Key Vault RBAC role assignments (requires User Access Administrator or Owner role)')
param deployRbacAssignments bool = false

// Azure SRE Agent parameters
@description('Enable Azure SRE Agent for automated incident response')
param enableSreAgent bool = true

@description('SRE Agent mode: Review = human approval required, Autonomous = auto-remediate, ReadOnly = observe only')
@allowed(['Review', 'Autonomous', 'ReadOnly'])
param sreAgentMode string = 'Review'

@description('GitHub repository URL for SRE Agent code integration')
param githubRepoUrl string = ''

// Resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: {
    environment: environmentName
    project: 'ContosoUniversity'
  }
}

// Deploy all resources into the resource group
module resources 'resources.bicep' = {
  name: 'resources-${environmentName}'
  scope: rg
  params: {
    environmentName: environmentName
    location: location
    webServiceName: webServiceName
    apiServiceName: apiServiceName
    sqlAuthMode: sqlAuthMode
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    sqlAppUserPassword: sqlAppUserPassword
    sqlAppUser: sqlAppUser
    sqlAadAdminName: sqlAadAdminName
    sqlAadAdminObjectId: sqlAadAdminObjectId
    sqlConnectionStringKey: sqlConnectionStringKey
    deployRbacAssignments: deployRbacAssignments
    enableSreAgent: enableSreAgent
    sreAgentMode: sreAgentMode
    githubRepoUrl: githubRepoUrl
  }
}

// =============================================================================
// Outputs
// =============================================================================
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_WEBAPP_NAME string = resources.outputs.webAppName
output AZURE_API_NAME string = resources.outputs.apiAppName
output AZURE_SQL_SERVER string = resources.outputs.sqlServerName
output AZURE_SQL_DATABASE string = resources.outputs.sqlDatabaseName
output AZURE_KEY_VAULT_NAME string = resources.outputs.keyVaultName
output AZURE_KEY_VAULT_ENDPOINT string = resources.outputs.keyVaultEndpoint
output AZURE_APPINSIGHTS_NAME string = resources.outputs.appInsightsName
output AZURE_LOAD_TEST_RESOURCE string = resources.outputs.loadTestingName
output AZURE_SRE_AGENT_NAME string = resources.outputs.sreAgentName
output AZURE_SRE_AGENT_MODE string = resources.outputs.sreAgentMode
output AZURE_SRE_AGENT_ID string = resources.outputs.sreAgentId
output AZURE_SRE_AGENT_PORTAL_URL string = resources.outputs.sreAgentPortalUrl
output AZURE_WEBAPP_URL string = resources.outputs.webUri
output AZURE_API_URL string = resources.outputs.apiUri
