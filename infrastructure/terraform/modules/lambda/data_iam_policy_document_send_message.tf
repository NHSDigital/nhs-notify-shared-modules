data "aws_iam_policy_document" "send_message" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  statement {
    sid    = "SQSSendMessage"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      aws_sqs_queue.lambda_dlq[0].arn,
    ]
  }

  statement {
    sid    = "KMSLambdaDLQKeyAccess"
    effect = "Allow"

    actions = [
      "kms:GenerateDataKey",
      "kms:Decrypt",
    ]

    resources = [
      var.kms_key_arn,
    ]
  }
}
