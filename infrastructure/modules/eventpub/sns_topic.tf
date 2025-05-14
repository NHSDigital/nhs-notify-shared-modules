resource "aws_sns_topic" "main" {
  name              = local.csi
  kms_master_key_id = var.kms_key_arn

  application_failure_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  application_success_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  application_success_feedback_sample_rate = var.enable_sns_delivery_logging == true ? var.sns_success_logging_sample_percent : null

  firehose_failure_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  firehose_success_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  firehose_success_feedback_sample_rate = var.enable_sns_delivery_logging == true ? var.sns_success_logging_sample_percent : null

  http_failure_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  http_success_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  http_success_feedback_sample_rate = var.enable_sns_delivery_logging == true ? var.sns_success_logging_sample_percent : null

  lambda_failure_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  lambda_success_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  lambda_success_feedback_sample_rate = var.enable_sns_delivery_logging == true ? var.sns_success_logging_sample_percent : null

  sqs_failure_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  sqs_success_feedback_role_arn    = var.enable_sns_delivery_logging == true ? aws_iam_role.sns_delivery_logging_role[0].arn : null
  sqs_success_feedback_sample_rate = var.enable_sns_delivery_logging == true ? var.sns_success_logging_sample_percent : null
}
