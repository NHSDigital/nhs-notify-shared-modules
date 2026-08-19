<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->


## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.9.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_acct_s3_buckets"></a> [acct\_s3\_buckets](#input\_acct\_s3\_buckets) | Account S3 buckets | `map(any)` | n/a | yes |
| <a name="input_apim_auth_token_schedule"></a> [apim\_auth\_token\_schedule](#input\_apim\_auth\_token\_schedule) | Schedule to renew the APIM auth token | `string` | `"rate(9 minutes)"` | no |
| <a name="input_apim_auth_token_url"></a> [apim\_auth\_token\_url](#input\_apim\_auth\_token\_url) | URL to generate an APIM auth token | `string` | n/a | yes |
| <a name="input_apim_keygen_schedule"></a> [apim\_keygen\_schedule](#input\_apim\_keygen\_schedule) | Schedule to refresh key pairs if necessary | `string` | `"cron(0 14 * * ? *)"` | no |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_cdn_logs_bucket_id"></a> [cdn\_logs\_bucket\_id](#input\_cdn\_logs\_bucket\_id) | Bucket for Cloudfront logging | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the terraformscaffold component calling this module | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the terraformscaffold environment the module is called for | `string` | n/a | yes |
| <a name="input_force_destroy"></a> [force\_destroy](#input\_force\_destroy) | Flag to force deletion of S3 buckets | `bool` | `false` | no |
| <a name="input_force_lambda_code_deploy"></a> [force\_lambda\_code\_deploy](#input\_force\_lambda\_code\_deploy) | If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development | `bool` | `false` | no |
| <a name="input_group"></a> [group](#input\_group) | The name of the tfscaffold group | `string` | `null` | no |
| <a name="input_kms_key_arn"></a> [kms\_key\_arn](#input\_kms\_key\_arn) | KMS key arn to use for this function | `string` | n/a | yes |
| <a name="input_lambda_timeout_seconds"></a> [lambda\_timeout\_seconds](#input\_lambda\_timeout\_seconds) | The timeout of the lambdas that are triggered by SQS. | `string` | `"45"` | no |
| <a name="input_log_level"></a> [log\_level](#input\_log\_level) | The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels | `string` | `"INFO"` | no |
| <a name="input_log_retention_in_days"></a> [log\_retention\_in\_days](#input\_log\_retention\_in\_days) | The retention period in days for the Cloudwatch Logs events to be retained, default of 0 is indefinite | `number` | `0` | no |
| <a name="input_log_subscription_role_arn"></a> [log\_subscription\_role\_arn](#input\_log\_subscription\_role\_arn) | ARN for log subscription role | `string` | n/a | yes |
| <a name="input_name"></a> [name](#input\_name) | A unique name to distinguish this module invocation from others within the same CSI scope | `string` | n/a | yes |
| <a name="input_parent_acct_environment"></a> [parent\_acct\_environment](#input\_parent\_acct\_environment) | Name of the environment responsible for the acct resources used, affects things like DNS zone. Useful for named dev environments | `string` | `"main"` | no |
| <a name="input_project"></a> [project](#input\_project) | The name of the terraformscaffold project calling the module | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_root_domain_id"></a> [root\_domain\_id](#input\_root\_domain\_id) | Root domain ID to host the APIM public key | `string` | n/a | yes |
| <a name="input_root_domain_name"></a> [root\_domain\_name](#input\_root\_domain\_name) | Root domain name to host the APIM public key | `string` | n/a | yes |
| <a name="input_shared_infra_account_id"></a> [shared\_infra\_account\_id](#input\_shared\_infra\_account\_id) | The AWS Shared Infra Account ID (numeric) | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_apim_access_token_ssm_parameter"></a> [apim\_access\_token\_ssm\_parameter](#output\_apim\_access\_token\_ssm\_parameter) | APIM Access Token SSM parameter details |

<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
