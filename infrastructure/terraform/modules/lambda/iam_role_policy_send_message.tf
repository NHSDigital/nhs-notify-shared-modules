resource "aws_iam_role_policy" "send_message" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  name   = "${local.csi}-send-message"
  role   = aws_iam_role.main.id
  policy = data.aws_iam_policy_document.send_message[0].json
}
