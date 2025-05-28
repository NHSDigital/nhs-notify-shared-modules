output "key_arn" {
  description = "ARN of the KMS key"
  value = aws_kms_key.main.arn
}

output "key_id" {
  description = "ID of the KMS key"
  value = aws_kms_key.main.key_id
}

output "admin_policy_arn" {
  description = "ARN of the admin IAM policy"
  value = aws_iam_policy.admin.arn
}

output "user_policy_arn" {
  description = "ARN of the user IAM policy"
  value = aws_iam_policy.user.arn
}
