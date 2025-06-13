resource "aws_cloudwatch_log_group" "sns_delivery_logging_failure" {
  for_each = var.enable_event_cache ? local.sns_topics : {}

  # SNS doesn't allow specifying a log group and is derived as: sns/${region}/${account_id}/${name_of_sns_topic}/Failure
  # (for failure logs)
  name = "sns/${var.region}/${var.aws_account_id}/${local.csi}${each.key == "data" ? "-data" : "-control"}/Failure"
  kms_key_id        = var.kms_key_arn
  retention_in_days = var.log_retention_in_days
}
