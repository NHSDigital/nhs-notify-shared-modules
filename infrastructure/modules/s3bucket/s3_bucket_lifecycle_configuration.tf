resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count  = length(local.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = local.lifecycle_rules

    content {
      id = "${var.name}-${rule.key}"

      status = rule.value.enabled ? "Enabled" : "Disabled"

      filter {
        prefix = rule.value.prefix != "" ? rule.value.prefix : null
      }

      dynamic "expiration" {
        for_each = rule.value.expiration

        content {
          days = expiration.value
        }
      }

      dynamic "transition" {
        for_each = rule.value.transition

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "noncurrent_version_transition" {
        for_each = rule.value.noncurrent_version_transition

        content {
          noncurrent_days = noncurrent_version_transition.value.noncurrent_days
          storage_class   = noncurrent_version_transition.value.storage_class
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration

        content {
          noncurrent_days = noncurrent_version_expiration.value
        }
      }

      dynamic "abort_incomplete_multipart_upload" {
        for_each = rule.value.abort_incomplete_multipart_upload

        content {
          days_after_initiation = abort_incomplete_multipart_upload.value
        }
      }
    }
  }
}
