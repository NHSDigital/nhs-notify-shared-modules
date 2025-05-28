output "sqs_queue_url" {
  description = "The URL of the SQS queue"
  value = aws_sqs_queue.sqs_queue.id
}

output "sqs_queue_arn" {
  description = "The ARN of the SQS queue"
  value = aws_sqs_queue.sqs_queue.arn
}

output "sqs_dlq_url" {
  description = "The URL of the SQS dead-letter queue"
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].id : null
}

output "sqs_dlq_arn" {
  description = "The ARN of the SQS dead-letter queue"
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].arn : null
}

output "sqs_queue_name" {
  description = "The name of the SQS queue"
  value = "${local.csi}-queue"
}

output "sqs_dlq_name" {
  description = "The name of the SQS dead-letter queue"
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].name : null
}
