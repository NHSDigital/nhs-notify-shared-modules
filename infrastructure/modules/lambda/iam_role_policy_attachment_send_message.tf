resource "aws_iam_role_policy_attachment" "send_message" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.send_message[0].arn
}
