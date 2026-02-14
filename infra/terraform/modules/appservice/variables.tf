variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region (e.g., eastus2)."
  type        = string
}

variable "service_plan_name" {
  description = "App Service Plan name."
  type        = string
}

variable "web_app_name" {
  description = "Web App name (globally unique)."
  type        = string
}

variable "os_type" {
  description = "Plan OS type (Windows or Linux)."
  type        = string
  default     = "Windows"
}

variable "sku_name" {
  description = "App Service Plan SKU name (e.g., B1, S1, P1v3)."
  type        = string
  default     = "B1"
}

variable "always_on" {
  description = "Whether to keep the app always on."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
