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
        type        = statement.value.principal.type
        identifiers = statement.value.principal.identifiers
      }

      actions = [
        "sts:AssumeRole",
      ]
      dynamic "condition" {
        for_each = statement.value.condition

        content {
          test     = condition.value.test
          variable = condition.value.variable
          values   = condition.value.values
        }
      }
    }
  }
}
