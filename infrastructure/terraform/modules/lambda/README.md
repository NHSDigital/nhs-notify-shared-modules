<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 0.12 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_application_log_level"></a> [application\_log\_level](#input\_application\_log\_level) | The detail level of the logs the application sends to CloudWatch | `string` | `"INFO"` | no |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the tfscaffold component | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_description"></a> [description](#input\_description) | Description of the Lambda | `string` | n/a | yes |
| <a name="input_enable_dlq_and_notifications"></a> [enable\_dlq\_and\_notifications](#input\_enable\_dlq\_and\_notifications) | Create an SQS Queue and on-failure destination to be used as the Lambda's Dead Letter Queue and notifications | `bool` | `false` | no |
| <a name="input_enable_lambda_insights"></a> [enable\_lambda\_insights](#input\_enable\_lambda\_insights) | Enable the lambda insights layer, this must be disabled for lambda@edge usage | `bool` | `true` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_filter_pattern"></a> [filter\_pattern](#input\_filter\_pattern) | Filter pattern to use for the log subscription filter | `string` | `""` | no |
| <a name="input_force_lambda_code_deploy"></a> [force\_lambda\_code\_deploy](#input\_force\_lambda\_code\_deploy) | If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development | `bool` | `false` | no |
| <a name="input_function_code_base_path"></a> [function\_code\_base\_path](#input\_function\_code\_base\_path) | The base path to the sourcecode directories needed for this lambda | `string` | `"./"` | no |
| <a name="input_function_code_dir"></a> [function\_code\_dir](#input\_function\_code\_dir) | The directory for this lambda | `string` | `null` | no |
| <a name="input_function_include_common"></a> [function\_include\_common](#input\_function\_include\_common) | Include the 'common' lambda module with this lambda | `bool` | `true` | no |
| <a name="input_function_module_name"></a> [function\_module\_name](#input\_function\_module\_name) | The name of the function module as used by the lambda handler, e.g. index or exports | `string` | `"index"` | no |
| <a name="input_function_name"></a> [function\_name](#input\_function\_name) | Base name of this lambda | `string` | n/a | yes |
| <a name="input_function_s3_bucket"></a> [function\_s3\_bucket](#input\_function\_s3\_bucket) | The bucket to upload Lambda packages to | `string` | `null` | no |
| <a name="input_group"></a> [group](#input\_group) | The name of the tfscaffold group | `string` | `null` | no |
| <a name="input_handler_function_name"></a> [handler\_function\_name](#input\_handler\_function\_name) | The name of the lambda handler function (passed directly to the Lambda's handler option) | `string` | `"handler"` | no |
| <a name="input_iam_policy_document"></a> [iam\_policy\_document](#input\_iam\_policy\_document) | n/a | <pre>object({<br/>    body = string<br/>  })</pre> | `null` | no |
| <a name="input_image_config"></a> [image\_config](#input\_image\_config) | Optional image configuration for Image-based Lambda | <pre>object({<br/>    entry_point       = optional(list(string))<br/>    command           = optional(list(string))<br/>    working_directory = optional(string)<br/>  })</pre> | `null` | no |
| <a name="input_image_repository_names"></a> [image\_repository\_names](#input\_image\_repository\_names) | ECR repository names allowed for Image-based Lambda | `list(string)` | `[]` | no |
| <a name="input_image_uri"></a> [image\_uri](#input\_image\_uri) | ECR image URI for Image-based Lambda | `string` | `null` | no |
| <a name="input_kms_key_arn"></a> [kms\_key\_arn](#input\_kms\_key\_arn) | KMS key arn to use for this function | `string` | n/a | yes |
| <a name="input_lambda_at_edge"></a> [lambda\_at\_edge](#input\_lambda\_at\_edge) | Whether this Lambda is a Lambda@Edge function | `bool` | `false` | no |
| <a name="input_lambda_dlq_message_retention_seconds"></a> [lambda\_dlq\_message\_retention\_seconds](#input\_lambda\_dlq\_message\_retention\_seconds) | The number of seconds to retain messages in the Lambda DLQ SQS queue | `number` | `1209600` | no |
| <a name="input_lambda_env_vars"></a> [lambda\_env\_vars](#input\_lambda\_env\_vars) | Lambda environment parameters map | `map(string)` | `{}` | no |
| <a name="input_layers"></a> [layers](#input\_layers) | Lambda layer arns to include | `list(any)` | `[]` | no |
| <a name="input_log_destination_arn"></a> [log\_destination\_arn](#input\_log\_destination\_arn) | Destination ARN to use for the log subscription filter | `string` | `""` | no |
| <a name="input_log_level"></a> [log\_level](#input\_log\_level) | The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels | `string` | `"INFO"` | no |
| <a name="input_log_retention_in_days"></a> [log\_retention\_in\_days](#input\_log\_retention\_in\_days) | The retention period in days for the Cloudwatch Logs events generated by the lambda function | `number` | n/a | yes |
| <a name="input_log_subscription_lambda_create_permission"></a> [log\_subscription\_lambda\_create\_permission](#input\_log\_subscription\_lambda\_create\_permission) | Whether to create a permission for the log forwarder. Set to false if using a generic one. | `bool` | `true` | no |
| <a name="input_log_subscription_role_arn"></a> [log\_subscription\_role\_arn](#input\_log\_subscription\_role\_arn) | The ARN of the IAM role to use for the log subscription filter | `string` | `""` | no |
| <a name="input_memory"></a> [memory](#input\_memory) | The amount of memory to apply to the created Lambda | `number` | n/a | yes |
| <a name="input_package_type"></a> [package\_type](#input\_package\_type) | Lambda package type: Zip or Image | `string` | `"Zip"` | no |
| <a name="input_permission_statements"></a> [permission\_statements](#input\_permission\_statements) | Statements giving an external source permission to invoke the Lambda function | <pre>list(object({<br/>    action         = optional(string)<br/>    principal      = string<br/>    source_arn     = optional(string)<br/>    source_account = optional(string)<br/>    statement_id   = string<br/>  }))</pre> | `[]` | no |
| <a name="input_project"></a> [project](#input\_project) | The name of the tfscaffold project | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_runtime"></a> [runtime](#input\_runtime) | The runtime to use for the lambda function | `string` | `null` | no |
| <a name="input_schedule"></a> [schedule](#input\_schedule) | The fully qualified Cloudwatch Events schedule for when to run the lambda function, e.g. rate(1 day) or a cron() expression. Default disables all events resources | `string` | `""` | no |
| <a name="input_send_to_firehose"></a> [send\_to\_firehose](#input\_send\_to\_firehose) | Enable sending logs to firehose | `bool` | `true` | no |
| <a name="input_sns_destination"></a> [sns\_destination](#input\_sns\_destination) | SNS Topic ARN to be used for on-failure Lambda invocation records | `string` | `null` | no |
| <a name="input_sns_destination_kms_key"></a> [sns\_destination\_kms\_key](#input\_sns\_destination\_kms\_key) | KMS Key ARN to be used for SNS Topic for on-failure Lambda invocation records | `string` | `null` | no |
| <a name="input_system_log_level"></a> [system\_log\_level](#input\_system\_log\_level) | The detail level of the Lambda platform event logs sent to CloudWatch | `string` | `"WARN"` | no |
| <a name="input_timeout"></a> [timeout](#input\_timeout) | Timeout in seconds of the lambda function invocation | `number` | n/a | yes |
| <a name="input_vpc_config"></a> [vpc\_config](#input\_vpc\_config) | Lambdas can run in a VPC, should be a map containing a subnet\_ids list and a security\_group\_ids list | `map(any)` | `null` | no |
## Modules

No modules.
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cloudwatch_log_group_name"></a> [cloudwatch\_log\_group\_name](#output\_cloudwatch\_log\_group\_name) | Name of the CloudWatch Log Group for the Lambda function |
| <a name="output_function_arn"></a> [function\_arn](#output\_function\_arn) | ARN of the Lambda function |
| <a name="output_function_env_vars"></a> [function\_env\_vars](#output\_function\_env\_vars) | Environment variables for the Lambda function |
| <a name="output_function_invoke_arn"></a> [function\_invoke\_arn](#output\_function\_invoke\_arn) | Invoke ARN of the Lambda function |
| <a name="output_function_name"></a> [function\_name](#output\_function\_name) | Name of the Lambda function |
| <a name="output_function_qualified_arn"></a> [function\_qualified\_arn](#output\_function\_qualified\_arn) | Qualified ARN of the Lambda function, including version or alias |
| <a name="output_iam_role_arn"></a> [iam\_role\_arn](#output\_iam\_role\_arn) | ARN of the IAM role associated with the Lambda function |
| <a name="output_iam_role_name"></a> [iam\_role\_name](#output\_iam\_role\_name) | Name of the IAM role associated with the Lambda function |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
