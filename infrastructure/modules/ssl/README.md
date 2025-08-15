<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.10.1 |
| <a name="requirement_tls"></a> [tls](#requirement\_tls) | 4.1.0 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The name of the tfscaffold component | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_name"></a> [name](#input\_name) | A unique name to distinguish this module invocation from others within the same CSI scope | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | The name of the tfscaffold project | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_subject_common_name"></a> [subject\_common\_name](#input\_subject\_common\_name) | Common name for certificate subject | `string` | n/a | yes |
| <a name="input_subject_country"></a> [subject\_country](#input\_subject\_country) | Country for certificate subject | `string` | `"GB"` | no |
| <a name="input_subject_locality"></a> [subject\_locality](#input\_subject\_locality) | Locality for certificate subject | `string` | `"Leeds"` | no |
| <a name="input_subject_organization"></a> [subject\_organization](#input\_subject\_organization) | Organization for certificate subject | `string` | `"NHS England"` | no |
| <a name="input_subject_organizational_unit"></a> [subject\_organizational\_unit](#input\_subject\_organizational\_unit) | Organizational unit for certificate subject | `string` | `"NHS Notify"` | no |
| <a name="input_subject_province"></a> [subject\_province](#input\_subject\_province) | Province for certificate subject | `string` | `"West Yorkshire"` | no |
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
