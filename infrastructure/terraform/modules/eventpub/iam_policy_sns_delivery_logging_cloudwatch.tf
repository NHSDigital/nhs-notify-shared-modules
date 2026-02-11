resource "aws_iam_policy" "sns_delivery_logging_cloudwatch" {
  count = var.enable_sns_delivery_logging ? 1 : 0

  name        = "${local.csi}-${var.name}-sns-delivery"
  description = "Policy for ${local.csi}-${var.name} SNS Delivery Logging"
  policy      = data.aws_iam_policy_document.sns_delivery_logging_cloudwatch[0].json
}

data "aws_iam_policy_document" "sns_delivery_logging_cloudwatch" {
  count = var.enable_sns_delivery_logging ? 1 : 0

  statement {
    sid    = "KMSCloudwatchKeyAccess"
    effect = "Allow"

    actions = [
      "kms:GenerateDataKey",
      "kms:Decrypt",
    ]

    resources = [
      var.kms_key_arn
    ]
  }

  statement {
    sid    = "AllowSNSDeliveryNotifications"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:PutMetricFilter",
      "logs:PutRetentionPolicy",
    ]

    resources = [
      aws_cloudwatch_log_group.sns_delivery_logging_success[0].arn,
      "${aws_cloudwatch_log_group.sns_delivery_logging_success[0].arn}:log-stream:*",
      aws_cloudwatch_log_group.sns_delivery_logging_failure[0].arn,
      "${aws_cloudwatch_log_group.sns_delivery_logging_failure[0].arn}:log-stream:*",
    ]
  }
}
