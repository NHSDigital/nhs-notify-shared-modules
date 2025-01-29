resource "aws_backup_report_plan" "resource_compliance" {
  name        = "${local.csi_underscore}_resource_compliance"
  description = "Report for showing whether resources are compliant with the framework"

  report_delivery_channel {
    formats = ["JSON"]
    s3_bucket_name = var.reports_bucket
    s3_key_prefix  = "resource_compliance"
  }

  report_setting {
    framework_arns = concat(
      var.backup_plan_config_dynamodb.enable ? [aws_backup_framework.dynamodb[0].arn] : [],
      var.backup_plan_config_s3.enable ? [aws_backup_framework.s3[0].arn] : []
    )

    number_of_frameworks = length(concat(
      var.backup_plan_config_dynamodb.enable ? [aws_backup_framework.dynamodb[0].arn] : [],
      var.backup_plan_config_s3.enable ? [aws_backup_framework.s3[0].arn] : []
    ))

    report_template      = "RESOURCE_COMPLIANCE_REPORT"
  }
}
