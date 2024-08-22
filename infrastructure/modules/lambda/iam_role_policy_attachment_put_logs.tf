resource "aws_iam_role_policy_attachment" "put_logs" {
  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.put_logs.arn
}
