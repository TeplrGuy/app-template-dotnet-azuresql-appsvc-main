variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
}

variable "vnet_name" {
  description = "Virtual network name."
  type        = string
}

variable "address_space" {
  description = "VNet address space."
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "app_integration_subnet_prefix" {
  description = "CIDR prefix for the App Service integration subnet."
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_endpoint_subnet_prefix" {
  description = "CIDR prefix for the private endpoints subnet."
  type        = string
  default     = "10.0.2.0/24"
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
