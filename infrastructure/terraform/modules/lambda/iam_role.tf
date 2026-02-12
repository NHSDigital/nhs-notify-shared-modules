resource "aws_iam_role" "main" {
  name               = local.csi
  assume_role_policy = data.aws_iam_policy_document.lambda_assumerole.json
}
