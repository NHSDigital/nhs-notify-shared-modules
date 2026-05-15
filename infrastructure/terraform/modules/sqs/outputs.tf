output "sqs_queue_url" {
  description = "The URL of the SQS queue"
  value       = aws_sqs_queue.sqs_queue.id
}

output "sqs_queue_arn" {
  description = "The ARN of the SQS queue"
  value       = aws_sqs_queue.sqs_queue.arn
}

output "sqs_dlq_url" {
  description = "The URL of the SQS dead-letter queue"
  value       = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].id : null
}

output "sqs_dlq_arn" {
  description = "The ARN of the SQS dead-letter queue"
  value       = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].arn : null
}

output "sqs_queue_name" {
  description = "The name of the SQS queue"
  value       = "${local.csi}-queue"
}

output "sqs_dlq_name" {
  description = "The name of the SQS dead-letter queue"
  value       = var.create_dlq ? aws_sqs_queue.deadletter_queue[0].name : null
}

output "sqs_dlq_messages_alarm_name" {
  description = "The name of the CloudWatch alarm for messages in the SQS dead-letter queue"
  value       = var.create_dlq && var.enable_dlq_alarm ? aws_cloudwatch_metric_alarm.dlq_messages[0].alarm_name : null
}

output "sqs_dlq_messages_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for messages in the SQS dead-letter queue"
  value       = var.create_dlq && var.enable_dlq_alarm ? aws_cloudwatch_metric_alarm.dlq_messages[0].arn : null
}

output "sqs_queue_oldest_message_alarm_name" {
  description = "The name of the CloudWatch alarm for oldest visible message age in the SQS queue"
  value       = var.enable_queue_oldest_message_alarm ? aws_cloudwatch_metric_alarm.queue_oldest_message[0].alarm_name : null
}

output "sqs_queue_oldest_message_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for oldest visible message age in the SQS queue"
  value       = var.enable_queue_oldest_message_alarm ? aws_cloudwatch_metric_alarm.queue_oldest_message[0].arn : null
}
