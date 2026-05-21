output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.main.invoke_arn
}

output "function_qualified_arn" {
  description = "Qualified ARN of the Lambda function, including version or alias"
  value       = aws_lambda_function.main.qualified_arn
}

output "function_env_vars" {
  description = "Environment variables for the Lambda function"
  value       = var.lambda_env_vars
}

output "iam_role_name" {
  description = "Name of the IAM role associated with the Lambda function"
  value       = aws_iam_role.main.name
}

output "iam_role_arn" {
  description = "ARN of the IAM role associated with the Lambda function"
  value       = aws_iam_role.main.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group for the Lambda function"
  value       = aws_cloudwatch_log_group.main.name
}

output "lambda_error_rate_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda error rate"
  value       = var.enable_error_rate_alarm ? aws_cloudwatch_metric_alarm.lambda_error_rate[0].alarm_name : null
}

output "lambda_error_rate_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda error rate"
  value       = var.enable_error_rate_alarm ? aws_cloudwatch_metric_alarm.lambda_error_rate[0].arn : null
}

output "lambda_throttles_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda throttles"
  value       = var.enable_throttles_alarm ? aws_cloudwatch_metric_alarm.lambda_throttles[0].alarm_name : null
}

output "lambda_throttles_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda throttles"
  value       = var.enable_throttles_alarm ? aws_cloudwatch_metric_alarm.lambda_throttles[0].arn : null
}

output "lambda_duration_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda duration percentile"
  value       = var.enable_duration_alarm ? aws_cloudwatch_metric_alarm.lambda_duration[0].alarm_name : null
}

output "lambda_duration_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda duration percentile"
  value       = var.enable_duration_alarm ? aws_cloudwatch_metric_alarm.lambda_duration[0].arn : null
}

output "lambda_dlq_messages_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda DLQ messages"
  value       = var.enable_dlq_and_notifications && var.enable_dlq_messages_alarm ? aws_cloudwatch_metric_alarm.lambda_dlq_messages[0].alarm_name : null
}

output "lambda_dlq_messages_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda DLQ messages"
  value       = var.enable_dlq_and_notifications && var.enable_dlq_messages_alarm ? aws_cloudwatch_metric_alarm.lambda_dlq_messages[0].arn : null
}
