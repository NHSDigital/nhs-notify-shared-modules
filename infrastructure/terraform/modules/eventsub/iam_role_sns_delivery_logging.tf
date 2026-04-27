resource "aws_iam_role" "sns_delivery_logging_role" {
  count = var.enable_sns_delivery_logging ? 1 : 0

  name               = "${local.csi}-sns-delivery-logging"
  assume_role_policy = data.aws_iam_policy_document.sns_delivery_logging_assume_role[0].json
}

data "aws_iam_policy_document" "sns_delivery_logging_assume_role" {
  count = var.enable_sns_delivery_logging ? 1 : 0

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}
