locals {
  module = "eventpub"

  csi = replace(
    format(
      "%s-%s-%s-%s",
      var.project,
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
  sns_topics = {
    data    = "${local.csi}-data"
    control = "${local.csi}-control"
  }
}
