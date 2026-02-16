# DEPRECATED: This is a legacy root module file.
# This file is kept for backward compatibility but should not be used directly.
# 
# Use the environment-specific Terraform root modules instead:
#   - infra/terraform/envs/staging/ for staging deployments
#   - infra/terraform/envs/prod/     for production deployments
#
# These environment compositions properly instantiate and configure all child modules.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
  }
}

provider "azurerm" {
  features {}

  # OIDC-friendly: prefer setting ARM_USE_OIDC=true and auth context via environment.
  # subscription_id/client_id/tenant_id are intentionally optional (null = omitted).
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  client_id       = var.client_id
}

# NOTE: This root is a shared skeleton. Use env compositions under envs/ (staging, prod)
# as the Terraform root modules that instantiate the child modules.
