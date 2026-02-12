resource "aws_iam_role_policy" "put_logs" {
  name   = "${local.csi}-put-logs"
  role   = aws_iam_role.main.id
  policy = data.aws_iam_policy_document.put_logs.json
}
