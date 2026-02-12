resource "aws_backup_report_plan" "copy_jobs" {
  count = var.backup_copy_vault_arn != "" && var.backup_copy_vault_account_id != "" ? 1 : 0

  name        = "${local.csi_underscore}_copy_jobs"
  description = "Report for showing whether copies ran successfully in the last 24 hours"

  report_delivery_channel {
    formats = [
      "JSON"
    ]
    s3_bucket_name = var.reports_bucket
    s3_key_prefix  = "copy_jobs"
  }

  report_setting {
    report_template = "COPY_JOB_REPORT"
  }
}
