resource "aws_iam_role_policy_attachment" "main" {
  count = var.iam_policy_document != null ? 1 : 0

  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.main[0].arn
}
