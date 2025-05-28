output "acl" {
  description = "The ACL of the S3 bucket. If the object ownership is set to 'BucketOwnerEnforced', the ACL will be 'private'. Otherwise, it will reflect the ACL set in the aws_s3_bucket_acl resource."
  value = var.object_ownership == "BucketOwnerEnforced" ? "private" : aws_s3_bucket_acl.main[0].acl
}

output "arn" {
  description = "The ARN of the S3 bucket"
  value = aws_s3_bucket.main.arn
}

output "bucket" {
  description = "The name of the S3 bucket"
  value = aws_s3_bucket.main.bucket
}

output "bucket_domain_name" {
  description = "The domain name of the S3 bucket"
  value = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "The regional domain name of the S3 bucket"
  value = aws_s3_bucket.main.bucket_regional_domain_name
}

output "hosted_zone_id" {
  description = "The hosted zone ID of the S3 bucket"
  value = aws_s3_bucket.main.hosted_zone_id
}

output "id" {
  description = "The ID of the S3 bucket"
  value = aws_s3_bucket.main.id
}

output "policy" {
  description = "The policy of the S3 bucket"
  value = aws_s3_bucket_policy.main.policy
}

output "region" {
  description = "The AWS region where the S3 bucket is located"
  value = aws_s3_bucket.main.region
}
