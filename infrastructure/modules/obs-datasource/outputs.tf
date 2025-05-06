output "log_subscription_role_arn" {
  description = "The ARN of the log subscription IAM role."
  value       = aws_iam_role.log_subscription_role.arn
}
