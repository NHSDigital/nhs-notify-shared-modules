resource "aws_iam_policy" "send_message" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  name        = "${local.csi}-send-message"
  description = "SQS DLQ SendMessage policy for ${var.function_name} Lambda"
  policy      = data.aws_iam_policy_document.send_message[0].json
}
