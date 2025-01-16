resource "aws_sqs_queue_policy" "sqs_queue_policy" {
  queue_url = aws_sqs_queue.sqs_queue.id
  policy    = jsonencode([
    data.aws_iam_policy_document.sqs_queue.json,
    var.sqs_policy_overload,
  ])
}
