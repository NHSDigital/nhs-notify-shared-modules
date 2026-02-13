resource "aws_iam_role_policy" "ecr" {
  count  = local.package_type == "image" ? 1 : 0
  name   = "${local.csi}-ecr"
  role   = aws_iam_role.main.id
  policy = data.aws_iam_policy_document.ecr.json
}
