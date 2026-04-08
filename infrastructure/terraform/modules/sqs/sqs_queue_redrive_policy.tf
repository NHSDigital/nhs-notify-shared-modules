resource "aws_sqs_queue_redrive_policy" "redrive_policy" {
  count = var.create_dlq ? 1 : 0

  queue_url = aws_sqs_queue.sqs_queue.url
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.deadletter_queue[0].arn
    maxReceiveCount     = var.max_receive_count
  })
}
