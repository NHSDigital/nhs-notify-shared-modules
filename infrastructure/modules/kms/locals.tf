locals {
  module = "kms"

  csi = format(
    "%s-%s-%s-%s",
    var.project,
    var.environment,
    var.component,
    var.name,
  )

  # CSI for use in resources with an account namespace, eg IAM roles
  csi_account = replace(
    format(
      "%s-%s-%s-%s-%s",
      var.project,
      var.region,
      var.environment,
      var.component,
      var.name,
    ),
    "_",
    "",
  )

  default_tags = merge(
    var.default_tags,
    {
      Module = local.module
      Name   = local.csi
    },
  )
}
