resource "aws_iam_role_policy" "ecr" {
  count  = var.package_type == "Image" ? 1 : 0
  name   = "${local.csi}-ecr"
  role   = aws_iam_role.main.id
  policy = data.aws_iam_policy_document.ecr.json
}
