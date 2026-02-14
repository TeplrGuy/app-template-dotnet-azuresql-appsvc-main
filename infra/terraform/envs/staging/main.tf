terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
  }

  # TODO: configure remote state backend (e.g., azurerm) for team usage.
  # backend "azurerm" {}
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  client_id       = var.client_id
}

locals {
  tags = merge(
    {
      environment = "staging"
      managed_by  = "terraform"
    },
    var.tags
  )

  # NOTE: Some resources require globally unique names (e.g., ACR, Web App).
  # Adjust name_prefix to ensure uniqueness per environment.
  resource_group_name = "${var.name_prefix}-staging-rg"

  # ACR name must be alphanumeric only.
  acr_name = substr("${regexreplace(lower(var.name_prefix), "[^0-9a-z]", "")}stgacr", 0, 50)

  app_service_plan_name = "${var.name_prefix}-staging-plan"
  web_app_name          = "${var.name_prefix}-staging-web" # TODO: ensure global uniqueness.

  log_analytics_name = "${var.name_prefix}-staging-law"
  app_insights_name  = "${var.name_prefix}-staging-appi"
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

module "appservice" {
  source = "../../modules/appservice"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  service_plan_name = local.app_service_plan_name
  web_app_name      = local.web_app_name

  tags = local.tags

  # TODO: wire monitoring + ACR + SQL settings into the Web App.
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "web_app_default_hostname" {
  value = module.appservice.web_app_default_hostname
}
