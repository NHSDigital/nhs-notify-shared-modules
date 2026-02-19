data "aws_iam_policy_document" "deadletter_queue" {
  count = var.create_dlq ? 1 : 0

  statement {
    effect = "Allow"

    resources = [aws_sqs_queue.deadletter_queue[0].arn]

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

  statement {
    sid    = "AllowSendMessage"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      aws_sqs_queue.deadletter_queue[0].arn,
    ]

    principals {
      type = "Service"
      identifiers = [
        "sqs.amazonaws.com"
      ]
    }
  }
}
