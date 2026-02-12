resource "aws_sqs_queue_policy" "deadletter_queue" {
  count = var.create_dlq ? 1 : 0

  queue_url = aws_sqs_queue.deadletter_queue[0].id
  policy    = data.aws_iam_policy_document.deadletter_queue[0].json
}
