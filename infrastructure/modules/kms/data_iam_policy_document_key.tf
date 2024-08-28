data "aws_iam_policy_document" "key" {
  source_policy_documents = var.key_policy_documents

  dynamic "statement" {
    for_each = var.iam_delegation ? [1] : []
    content {
      sid    = "AllowFullLocalAdministration"
      effect = "Allow"

      principals {
        type = "AWS"

        identifiers = [
          "arn:aws:iam::${var.aws_account_id}:root",
        ]
      }

      actions = [
        "kms:*",
      ]

      resources = [
        "*",
      ]
    }
  }
}
