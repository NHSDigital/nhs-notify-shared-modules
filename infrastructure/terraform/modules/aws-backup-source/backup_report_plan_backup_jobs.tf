# Create the reports
resource "aws_backup_report_plan" "backup_jobs" {
  name        = "${local.csi_underscore}_backup_jobs"
  description = "Report for showing whether backups ran successfully in the last 24 hours"

  report_delivery_channel {
    formats = [
      "JSON"
    ]
    s3_bucket_name = var.reports_bucket
    s3_key_prefix  = "backup_jobs"
  }

  report_setting {
    report_template = "BACKUP_JOB_REPORT"
  }
}
