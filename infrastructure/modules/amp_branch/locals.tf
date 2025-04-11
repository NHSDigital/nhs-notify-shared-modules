locals {
  module = "amp"

  csi = format(
    "%s-%s-%s-%s",
    var.project,
    var.environment,
    var.component,
    var.name,
  )

  default_tags = merge(
    var.default_tags,
    {
      Module = local.module
      Name   = local.csi
    },
  )
}
