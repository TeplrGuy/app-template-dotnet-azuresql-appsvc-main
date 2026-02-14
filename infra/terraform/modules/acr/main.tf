resource "azurerm_container_registry" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  sku           = var.sku
  admin_enabled = false

  tags = var.tags

  # TODO: add private endpoint, content trust, geo-replication, retention policies as needed.
}
