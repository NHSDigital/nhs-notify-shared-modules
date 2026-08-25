data "aws_iam_policy_document" "lambda_assumerole" {
  statement {
    sid    = "LambdaAssumeRole"
    effect = "Allow"

    principals {
      type = "Service"

      identifiers = [
        "edgelambda.amazonaws.com",
        "lambda.amazonaws.com",
      ]
    }

    actions = [
      "sts:AssumeRole",
    ]
  }

  dynamic "statement" {
    for_each = var.additional_assume_role_policy_statements

    content {
      sid    = statement.value.sid
      effect = statement.value.effect

      principals {
        type        = statement.value.principal_type
        identifiers = statement.value.principal_identifiers
      }

      actions = statement.value.actions
    }
  }
}
