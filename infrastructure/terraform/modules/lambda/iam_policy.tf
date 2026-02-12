resource "aws_iam_policy" "main" {
  count = var.iam_policy_document != null ? 1 : 0

  name        = local.csi
  description = "Policy created from the data object supplied through the modules attributes"
  policy      = var.iam_policy_document.body
}
