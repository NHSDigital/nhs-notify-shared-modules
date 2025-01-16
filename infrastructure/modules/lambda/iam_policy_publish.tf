resource "aws_iam_policy" "publish" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  name        = "${local.csi}-publish"
  description = "SNS Publish policy for ${var.function_name} Lambda"
  policy      = data.aws_iam_policy_document.publish[0].json
}
