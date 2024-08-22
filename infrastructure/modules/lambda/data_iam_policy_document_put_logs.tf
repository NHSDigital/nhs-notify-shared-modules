data "aws_iam_policy_document" "put_logs" {
  statement {
    sid    = "AllowLogging"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    #tfsec:ignore:aws-iam-no-policy-wildcards
    resources = [
      "${aws_cloudwatch_log_group.main.arn}:*",
    ]
  }

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
}
