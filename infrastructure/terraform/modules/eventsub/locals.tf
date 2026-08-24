locals {
  module = "eventsub"

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
  csi_global = replace(
    format(
      "%s-%s-%s-%s-%s",
      var.project,
      var.aws_account_id,
      var.region,
      var.environment,
      var.component,
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
  eventsub_shared_account_ids = (
    length(var.eventsub_shared_account_ids) > 0
    ? var.eventsub_shared_account_ids
    : [var.shared_infra_account_id]
  )
}
