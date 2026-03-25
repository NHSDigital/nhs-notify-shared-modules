resource "aws_iam_role_policy_attachment" "xray" {
  count = var.enable_xray_tracing ? 1 : 0

  role       = aws_iam_role.main.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}
