# Create the restore testing completion reports
resource "aws_backup_report_plan" "backup_restore_testing_jobs" {
  name        = "backup_restore_testing_jobs"
  description = "Report for showing whether backup restore test ran successfully in the last 24 hours"

  report_delivery_channel {
    formats = [
      "JSON"
    ]
    s3_bucket_name = var.reports_bucket
    s3_key_prefix  = "backup_restore_testing_jobs"
  }

  report_setting {
    report_template = "RESTORE_JOB_REPORT"
  }
}
