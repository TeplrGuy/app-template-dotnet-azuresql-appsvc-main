variable "name" {
  description = "ACR name (5-50 alphanumeric; globally unique)."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region (e.g., eastus2)."
  type        = string
}

variable "sku" {
  description = "ACR SKU."
  type        = string
  default     = "Basic"
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
