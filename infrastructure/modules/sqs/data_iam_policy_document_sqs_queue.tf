data "aws_iam_policy_document" "sqs_queue" {
  statement {
    effect = "Allow"

    resources = [aws_sqs_queue.sqs_queue.arn]

    actions = [
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ListQueueTags",
      "sqs:ReceiveMessage",
      "sqs:SendMessage",
    ]

    principals {
      type        = "AWS"
      identifiers = [var.aws_account_id]
    }
  }

  dynamic "statement" {
    for_each = var.sns_source_arn != null ? [1] : []

    content {
      effect = "Allow"

      principals {
        type = "Service"
        identifiers = [
          "sns.amazonaws.com"
        ]
      }

      actions = [
        "sqs:SendMessage",
        "sqs:SendMessageBatch",
      ]

      condition {
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values = [
          var.sns_source_arn
        ]
      }

      resources = [
        aws_sqs_queue.sqs_queue.arn,
      ]
    }
  }
}
