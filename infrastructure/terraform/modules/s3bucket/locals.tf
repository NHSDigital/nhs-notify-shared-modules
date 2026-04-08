locals {
  module = "s3bucket"

  # CSI for use in resources with a global namespace, i.e. S3 Buckets
  csi_global = replace(
    format(
      "%s-%s-%s-%s-%s-%s",
      var.project,
      var.aws_account_id,
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
      Name   = local.csi_global
    },
  )

  lifecycle_rule_defaults = {
    enabled = true
    prefix  = ""

    expiration = {}
    transition = []

    abort_incomplete_multipart_upload = {}
    noncurrent_version_expiration     = {}
    noncurrent_version_transition     = []
  }

  lifecycle_rules = [for lifecycle_rule in var.lifecycle_rules : merge(local.lifecycle_rule_defaults, lifecycle_rule)]

  notification_event_defaults = {
    eventbridge = false

    lambda_function = {}
    queue           = {}
    topic           = {}
  }

  notification_events = merge(local.notification_event_defaults, var.notification_events)
}
