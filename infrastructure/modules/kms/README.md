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
| <a name="input_alias"></a> [alias](#input\_alias) | Alias name for the hieradata KMS key | `string` | n/a | yes |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the terraformscaffold component calling this module | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | Default tag map for application to all taggable resources in the module | `map(string)` | `{}` | no |
| <a name="input_deletion_window"></a> [deletion\_window](#input\_deletion\_window) | KMS key deletion window | `string` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the terraformscaffold environment the module is called for | `string` | n/a | yes |
| <a name="input_iam_delegation"></a> [iam\_delegation](#input\_iam\_delegation) | Whether to delegate administration of the key to the local account. Defaults to true | `bool` | `true` | no |
| <a name="input_key_policy_documents"></a> [key\_policy\_documents](#input\_key\_policy\_documents) | List of KMS key policy JSON documents | `list(string)` | `[]` | no |
| <a name="input_name"></a> [name](#input\_name) | A unique name to distinguish this module invocation from others within the same CSI scope | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | The name of the terraformscaffold project calling the module | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
## Modules

No modules.
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_admin_policy_arn"></a> [admin\_policy\_arn](#output\_admin\_policy\_arn) | n/a |
| <a name="output_key_arn"></a> [key\_arn](#output\_key\_arn) | n/a |
| <a name="output_key_id"></a> [key\_id](#output\_key\_id) | n/a |
| <a name="output_user_policy_arn"></a> [user\_policy\_arn](#output\_user\_policy\_arn) | n/a |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
