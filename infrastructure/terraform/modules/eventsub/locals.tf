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
        days            = 90
        noncurrent_days = null
      }
      abort_incomplete_multipart_upload = {
        days                  = null
        days_after_initiation = 1
      }
    }
  ]

  # The default rule applies only when none are supplied
  event_cache_lifecycle_rules = [
    for rule in concat(
      [for default_rule in local.default_event_cache_lifecycle_rules : default_rule if length(var.lifecycle_rules_eventsub_event_cache) == 0],
      var.lifecycle_rules_eventsub_event_cache
      ) : {
      enabled = rule.enabled
      prefix  = rule.prefix

      expiration = rule.expiration == null ? {} : { days = rule.expiration.days }

      transition = rule.transition

      noncurrent_version_transition = rule.noncurrent_version_transition

      noncurrent_version_expiration = rule.noncurrent_version_expiration == null ? {} : {
        noncurrent_days = coalesce(rule.noncurrent_version_expiration.noncurrent_days, rule.noncurrent_version_expiration.days)
      }

      abort_incomplete_multipart_upload = rule.abort_incomplete_multipart_upload == null ? {} : {
        days_after_initiation = coalesce(rule.abort_incomplete_multipart_upload.days_after_initiation, rule.abort_incomplete_multipart_upload.days)
      }
    }
  ]
}
