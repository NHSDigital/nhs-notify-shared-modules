output "sqs_queue_url" {
  value = aws_sqs_queue.sqs_queue.id
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.sqs_queue.arn
}

output "sqs_dlq_url" {
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].id : null
}

output "sqs_dlq_arn" {
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].arn : null
}

output "sqs_queue_name" {
  value = "${local.csi}-queue"
}

output "sqs_dlq_name" {
  value = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].name : null
}
