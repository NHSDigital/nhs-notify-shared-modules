module "sqs_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/3.1.4/terraform-sqs.zip"

  aws_account_id                = var.aws_account_id
  component                     = var.component
  environment                   = var.environment
  project                       = var.project
  region                        = var.region
  name                          = var.name
  create_dlq                    = true
  sqs_kms_key_arn               = var.kms_key_arn
  sqs_policy_overload           = data.aws_iam_policy_document.allow_sns_send.json
  message_retention_seconds     = 1209600 # 14 days
  dlq_message_retention_seconds = 1209600
}

data "aws_iam_policy_document" "allow_sns_send" {
  statement {
    sid    = "AllowSNSSendMessage"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      module.sqs_queue.sqs_queue_arn,
    ]
  }
}
