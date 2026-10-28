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

  default_event_cache_lifecycle_rules = [
    {
      enabled    = true
      prefix     = ""
      expiration = null
      transition = []

      noncurrent_version_transition = [
        {
          noncurrent_days = 30
          storage_class   = "STANDARD_IA"
        }
      ]
      noncurrent_version_expiration = {
        noncurrent_days = 90
      }
      abort_incomplete_multipart_upload = {
        days_after_initiation = 1
      }
    }
  ]

  event_cache_lifecycle_rules = length(var.lifecycle_rules_eventsub_event_cache) == 0 ? local.default_event_cache_lifecycle_rules : [
    for rule in var.lifecycle_rules_eventsub_event_cache : {
      enabled = rule.enabled
      prefix  = rule.prefix

      expiration = rule.expiration == null ? {} : { days = rule.expiration.days }

      transition = rule.transition

      noncurrent_version_transition = rule.noncurrent_version_transition

      noncurrent_version_expiration = rule.noncurrent_version_expiration == null ? {} : { noncurrent_days = rule.noncurrent_version_expiration.noncurrent_days }

      abort_incomplete_multipart_upload = rule.abort_incomplete_multipart_upload == null ? {} : { days_after_initiation = rule.abort_incomplete_multipart_upload.days_after_initiation }
    }
  ]
}
