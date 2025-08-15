<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.10.1 |
| <a name="requirement_tls"></a> [tls](#requirement\_tls) | 4.0.5 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_module"></a> [module](#input\_module) | The variable encapsulating the name of this module | `string` | `"fe"` | no |
| <a name="input_parameter_bundle"></a> [parameter\_bundle](#input\_parameter\_bundle) | Contains all of the default parameters needed by any module in this project | <pre>object(<br/>    {<br/>      project                             = string<br/>      environment                         = string<br/>      component                           = string<br/>      group                               = string<br/>      region                              = string<br/>      account_ids                         = map(string)<br/>      account_name                        = string<br/>      default_kms_deletion_window_in_days = number<br/>      default_tags                        = map(string)<br/>      iam_resource_arns                   = map(string)<br/>      target_env                          = map(any)<br/>      cicd_bucket_name                    = string<br/>      pipeline_overrides                  = map(any)<br/>      cloudwatch_options                  = map(bool)<br/>      cloudwatch_metric_thresholds        = map(map(string))<br/>      terraform_root_dir                  = string<br/>    }<br/>  )</pre> | n/a | yes |
| <a name="input_truststore_s3_bucket"></a> [truststore\_s3\_bucket](#input\_truststore\_s3\_bucket) | The id of the mgmt truststore s3 bucket | `string` | n/a | yes |
## Modules

No modules.
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cacert_pem"></a> [cacert\_pem](#output\_cacert\_pem) | Truststore |
| <a name="output_server_crt"></a> [server\_crt](#output\_server\_crt) | Server Certificate |
| <a name="output_server_key"></a> [server\_key](#output\_server\_key) | Server Key |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->