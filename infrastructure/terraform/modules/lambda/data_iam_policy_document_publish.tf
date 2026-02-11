data "aws_iam_policy_document" "publish" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  statement {
    sid    = "SNSPublish"
    effect = "Allow"

    actions = [
      "sns:Publish",
    ]

    resources = [
      var.sns_destination,
    ]
  }

  statement {
    sid    = "KMSSNSTopicKeyAccess"
    effect = "Allow"

    actions = [
      "kms:GenerateDataKey",
      "kms:Decrypt",
    ]

    resources = [
      var.sns_destination_kms_key,
    ]
  }
}
