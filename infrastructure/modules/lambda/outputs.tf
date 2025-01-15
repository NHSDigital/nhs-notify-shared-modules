output "function_name" {
  value = aws_lambda_function.main.function_name
}

output "function_arn" {
  value = aws_lambda_function.main.arn
}

output "function_invoke_arn" {
  value = aws_lambda_function.main.invoke_arn
}

output "function_qualified_arn" {
  value = aws_lambda_function.main.qualified_arn
}

output "function_env_vars" {
  value = length(var.lambda_env_vars) == 0 ? [] : aws_lambda_function.main.environment[0].variables
}

output "iam_role_name" {
  value = aws_iam_role.main.name
}

output "iam_role_arn" {
  value = aws_iam_role.main.arn
}

output "cloudwatch_log_group_name" {
  value = aws_cloudwatch_log_group.main.name
}
