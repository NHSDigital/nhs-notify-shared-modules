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
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the terraformscaffold component calling this module | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | Default tag map for application to all taggable resources in the module | `map(string)` | `{}` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the terraformscaffold environment the module is called for | `string` | n/a | yes |
| <a name="input_log_group_configuration"></a> [log\_group\_configuration](#input\_log\_group\_configuration) | Configuration for filtering log groups in the link configuration. | <pre>object({<br/>    filter = string<br/>  })</pre> | `null` | no |
| <a name="input_metric_configuration"></a> [metric\_configuration](#input\_metric\_configuration) | Configuration for filtering metrics in the link configuration. | <pre>object({<br/>    filter = string<br/>  })</pre> | `null` | no |
| <a name="input_name"></a> [name](#input\_name) | A unique name to distinguish this module invocation from others within the same CSI scope | `string` | n/a | yes |
| <a name="input_oam_sink_id"></a> [oam\_sink\_id](#input\_oam\_sink\_id) | The ID of the Cloudwatch OAM sink in the appropriate observability account. | `string` | `""` | no |
| <a name="input_observability_account_id"></a> [observability\_account\_id](#input\_observability\_account\_id) | The Observability Account ID that needs access | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | The name of the terraformscaffold project calling the module | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
## Modules

No modules.
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_log_subscription_role_arn"></a> [log\_subscription\_role\_arn](#output\_log\_subscription\_role\_arn) | The ARN of the log subscription IAM role. |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
