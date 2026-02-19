resource "aws_cloudwatch_log_group" "sns_delivery_logging_success" {
  count = var.enable_sns_delivery_logging ? 1 : 0

  # SNS doesn't allow specifying a log group and is derived as: sns/${region}/${account_id}/${name_of_sns_topic}/Failure
  # (for failure logs)
  name              = "sns/${var.region}/${var.aws_account_id}/${local.csi}"
  kms_key_id        = var.kms_key_arn
  retention_in_days = var.log_retention_in_days
}
