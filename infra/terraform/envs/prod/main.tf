terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
  }

  backend "azurerm" {
    use_oidc         = true
    use_azuread_auth = true
    # Remaining config via -backend-config flags in CI:
    #   -backend-config="resource_group_name=..."
    #   -backend-config="storage_account_name=..."
    #   -backend-config="container_name=tfstate"
    #   -backend-config="key=prod.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}

  subscription_id            = var.subscription_id
  tenant_id                  = var.tenant_id
  client_id                  = var.client_id
  use_oidc                   = true
  storage_use_azuread        = true
}

locals {
  tags = merge(
    {
      environment = "prod"
      managed_by  = "terraform"
    },
    var.tags
  )

  resource_group_name = "${var.name_prefix}-prod-rg"
  acr_name            = substr("${replace(lower(var.name_prefix), "/[^0-9a-z]/", "")}prodacr", 0, 50)
  sql_server_name     = "${var.name_prefix}-prod-sql"
  sql_database_name   = "contosouniversity"

  app_service_plan_name = "${var.name_prefix}-prod-plan"
  backend_app_name      = "${var.name_prefix}-prod-api"
  frontend_app_name     = "${var.name_prefix}-prod-web"

  log_analytics_name = "${var.name_prefix}-prod-law"
  app_insights_name  = "${var.name_prefix}-prod-appi"
}

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.tags
}

module "acr" {
  source = "../../modules/acr"

  name                = local.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  log_analytics_workspace_name = local.log_analytics_name
  application_insights_name    = local.app_insights_name
  tags                         = local.tags
}

module "sql" {
  source = "../../modules/sql"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  server_name         = local.sql_server_name
  database_name       = local.sql_database_name
  sku_name            = "S0"

  aad_admin_login     = var.aad_admin_login
  aad_admin_object_id = var.aad_admin_object_id
  aad_admin_tenant_id = var.tenant_id != null ? var.tenant_id : ""

  tags = local.tags
}

module "appservice" {
  source = "../../modules/appservice"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  service_plan_name = local.app_service_plan_name
  backend_app_name  = local.backend_app_name
  frontend_app_name = local.frontend_app_name
  sku_name          = "S1"

  acr_login_server = module.acr.login_server
  acr_id           = module.acr.id

  sql_connection_string          = module.sql.connection_string
  app_insights_connection_string = module.monitoring.application_insights_connection_string

  tags = local.tags
}

# --- Outputs ---

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "backend_app_name" {
  value = module.appservice.backend_app_name
}

output "backend_default_hostname" {
  value = module.appservice.backend_default_hostname
}

output "frontend_app_name" {
  value = module.appservice.frontend_app_name
}

output "frontend_default_hostname" {
  value = module.appservice.frontend_default_hostname
}

output "sql_server_fqdn" {
  value = module.sql.server_fqdn
}
