resource "aws_iam_role" "log_subscription_role" {
  name = "${local.csi}-log-subscription-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "log_subscription_policy" {
  name        = "${local.csi}-log-subscription-policy"
  description = "Policy for log subscription to send logs to the destination"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutSubscriptionFilter",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${var.observability_account_id}:destination:nhs-notify-main-acct-firehose-logs"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "log_subscription_policy_attachment" {
  role       = aws_iam_role.log_subscription_role.name
  policy_arn = aws_iam_policy.log_subscription_policy.arn
}
