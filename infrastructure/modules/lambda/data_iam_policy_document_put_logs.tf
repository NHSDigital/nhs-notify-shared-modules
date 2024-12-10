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

  dynamic "statement" {
    # Lambda@Edge logs are logged into Log Groups in the region of the edge location
    # that executes the code. Because of this, we need to allow the lambda role to create
    # Log Groups in other regions
    for_each = var.lambda_at_edge ? [1] : []
    content {
      sid    = "AllowLambdaAtEdgeLogging"
      effect = "Allow"

      actions = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:CreateLogGroup",
      ]

      resources = [
        format(
          "arn:aws:logs:us-east-1:%s:log-group:/aws/lambda/%s:*",
          var.aws_account_id,
          var.function_name,
        ),
        format(
          "arn:aws:logs:*:%s:log-group:/aws/lambda/*.%s:*",
          var.aws_account_id,
          local.csi,
        ),
      ]
    }
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
