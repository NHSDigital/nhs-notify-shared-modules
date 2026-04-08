resource "aws_sns_topic" "backup" {
  count             = var.notifications_target_email_address != "" ? 1 : 0
  name              = "${local.csi}-notifications"
  kms_master_key_id = var.notification_kms_key
  policy            = data.aws_iam_policy_document.allow_backup_to_sns.json
}

data "aws_iam_policy_document" "allow_backup_to_sns" {
  policy_id = "backup"

  statement {
    actions = [
      "SNS:Publish",
    ]

    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }

    resources = ["*"]

    sid = "allow_backup"
  }
}

resource "aws_sns_topic_subscription" "aws_backup_notifications_email_target" {
  count         = var.notifications_target_email_address != "" ? 1 : 0
  topic_arn     = aws_sns_topic.backup[0].arn
  protocol      = "email"
  endpoint      = var.notifications_target_email_address
  filter_policy = jsonencode({ "State" : [{ "anything-but" : "COMPLETED" }] })
}
