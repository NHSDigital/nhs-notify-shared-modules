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
  value       = length(var.lambda_env_vars) == 0 ? {} : aws_lambda_function.main.environment[0].variables
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
