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

  override_policy_documents = [var.sqs_policy_overload]
}
