resource "aws_iam_role_policy" "publish" {
  count = var.enable_dlq_and_notifications ? 1 : 0

  name   = "${local.csi}-publish"
  role   = aws_iam_role.main.id
  policy = data.aws_iam_policy_document.publish[0].json
}
