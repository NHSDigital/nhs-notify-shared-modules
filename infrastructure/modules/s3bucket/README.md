<!-- BEGIN_TF_DOCS -->
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_acl"></a> [acl](#input\_acl) | ACL to set on the bucket. Defaults to private | `string` | `"private"` | no |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_bucket_key_enabled"></a> [bucket\_key\_enabled](#input\_bucket\_key\_enabled) | Boolean to toggle bucket key enablement | `bool` | `true` | no |
| <a name="input_bucket_logging_target"></a> [bucket\_logging\_target](#input\_bucket\_logging\_target) | Map of S3 bucket access logging target properties | `map(string)` | `{}` | no |
| <a name="input_bucket_notification_depends_on"></a> [bucket\_notification\_depends\_on](#input\_bucket\_notification\_depends\_on) | Bucket notification explicit dependencies for depends\_on meta | `list(any)` | `[]` | no |
| <a name="input_component"></a> [component](#input\_component) | The name of the tfscaffold component | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_force_destroy"></a> [force\_destroy](#input\_force\_destroy) | Boolean to toggle force destroy of bucket. Defaults to true; should be changed in exceptional circumstances | `bool` | `true` | no |
| <a name="input_kms_key_arn"></a> [kms\_key\_arn](#input\_kms\_key\_arn) | ARN of default encryption KMS key for this bucket. If omitted, will use AES256 | `string` | `null` | no |
| <a name="input_lifecycle_rules"></a> [lifecycle\_rules](#input\_lifecycle\_rules) | Object representing the lifecycle rules of the bucket | `any` | `[]` | no |
| <a name="input_module"></a> [module](#input\_module) | The variable encapsulating the name of this module | `string` | `"s3bucket"` | no |
| <a name="input_name"></a> [name](#input\_name) | The variable encapsulating the name of this bucket | `string` | n/a | yes |
| <a name="input_notification_events"></a> [notification\_events](#input\_notification\_events) | Object representing the notification events for the bucket | `any` | `{}` | no |
| <a name="input_object_ownership"></a> [object\_ownership](#input\_object\_ownership) | Ownership of objects written to the bucket | `string` | `"BucketOwnerEnforced"` | no |
| <a name="input_policy_documents"></a> [policy\_documents](#input\_policy\_documents) | A list of JSON policies to use to build the bucket policy | `list(string)` | `[]` | no |
| <a name="input_project"></a> [project](#input\_project) | The name of the tfscaffold project | `string` | n/a | yes |
| <a name="input_public_access"></a> [public\_access](#input\_public\_access) | Object representing the public access rules of the bucket | <pre>object({<br/>    block_public_acls       = bool<br/>    block_public_policy     = bool<br/>    ignore_public_acls      = bool<br/>    restrict_public_buckets = bool<br/>  })</pre> | <pre>{<br/>  "block_public_acls": true,<br/>  "block_public_policy": true,<br/>  "ignore_public_acls": true,<br/>  "restrict_public_buckets": true<br/>}</pre> | no |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_versioning"></a> [versioning](#input\_versioning) | Toggle for versioning the bucket. Defaults to true | `bool` | `true` | no |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_acl"></a> [acl](#output\_acl) | n/a |
| <a name="output_arn"></a> [arn](#output\_arn) | n/a |
| <a name="output_bucket"></a> [bucket](#output\_bucket) | n/a |
| <a name="output_bucket_domain_name"></a> [bucket\_domain\_name](#output\_bucket\_domain\_name) | n/a |
| <a name="output_bucket_regional_domain_name"></a> [bucket\_regional\_domain\_name](#output\_bucket\_regional\_domain\_name) | n/a |
| <a name="output_hosted_zone_id"></a> [hosted\_zone\_id](#output\_hosted\_zone\_id) | n/a |
| <a name="output_id"></a> [id](#output\_id) | n/a |
| <a name="output_policy"></a> [policy](#output\_policy) | n/a |
| <a name="output_region"></a> [region](#output\_region) | n/a |
## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |
## Resources

| Name | Type |
|------|------|
| [aws_s3_bucket.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) | resource |
| [aws_s3_bucket_acl.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_acl) | resource |
| [aws_s3_bucket_lifecycle_configuration.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_lifecycle_configuration) | resource |
| [aws_s3_bucket_logging.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_logging) | resource |
| [aws_s3_bucket_notification.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_notification) | resource |
| [aws_s3_bucket_ownership_controls.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_ownership_controls) | resource |
| [aws_s3_bucket_policy.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_policy) | resource |
| [aws_s3_bucket_public_access_block.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) | resource |
| [aws_s3_bucket_server_side_encryption_configuration.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_server_side_encryption_configuration) | resource |
| [aws_s3_bucket_versioning.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_versioning) | resource |
| [aws_iam_policy_document.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
<!-- END_TF_DOCS -->