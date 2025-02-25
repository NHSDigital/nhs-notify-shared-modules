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
| <a name="input_amplify_app_id"></a> [amplify\_app\_id](#input\_amplify\_app\_id) | Amplify application ID | `string` | n/a | yes |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_branch"></a> [branch](#input\_branch) | The name of the branch being deployed | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the terraformscaffold component calling this module | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | Default tag map for application to all taggable resources in the module | `map(string)` | `{}` | no |
| <a name="input_description"></a> [description](#input\_description) | Description for the branch | `string` | n/a | yes |
| <a name="input_display_name"></a> [display\_name](#input\_display\_name) | The display name of the branch app being deployed | `string` | `null` | no |
| <a name="input_enable_auto_build"></a> [enable\_auto\_build](#input\_enable\_auto\_build) | Enable the auto build of the branch code as well as just the resources for it | `bool` | `false` | no |
| <a name="input_enable_pull_request_preview"></a> [enable\_pull\_request\_preview](#input\_enable\_pull\_request\_preview) | Enable the pull request preview | `bool` | `false` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the terraformscaffold environment the module is called for | `string` | n/a | yes |
| <a name="input_environment_variables"></a> [environment\_variables](#input\_environment\_variables) | Environment variables to be used for amplify branch | `map(string)` | `{}` | no |
| <a name="input_framework"></a> [framework](#input\_framework) | Set what framework to use | `string` | `null` | no |
| <a name="input_group"></a> [group](#input\_group) | The group variables are being inherited from (often synonmous with account short-name) | `string` | n/a | yes |
| <a name="input_module"></a> [module](#input\_module) | The name of this module. This is a special variable, it should be set only here and never overridden. | `string` | `"kms"` | no |
| <a name="input_name"></a> [name](#input\_name) | A unique name to distinguish this module invocation from others within the same CSI scope | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | The name of the terraformscaffold project calling the module | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_stage"></a> [stage](#input\_stage) | Determine what stage is being deployed for | `string` | `null` | no |
## Modules

No modules.
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_name"></a> [name](#output\_name) | n/a |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
