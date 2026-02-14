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
