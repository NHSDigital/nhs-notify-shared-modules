locals {
  module = "apim-authentication"

  csi = replace(
    format(
      "%s-%s-%s-%s",
      var.project,
      var.environment,
      var.component,
      var.name,
    ),
    "_",
    "",
  )
  default_tags = merge(
    var.default_tags,
    {
      Module = local.module
      Name   = local.csi
    },
  )
  log_destination_arn                  = "arn:aws:logs:${var.region}:${var.shared_infra_account_id}:destination:nhs-main-obs-firehose-logs"
  apim_access_token_ssm_parameter_name = "/${var.component}/${var.environment}/apim/access_token"
  apim_api_key_ssm_parameter_name      = "/${var.component}/${var.environment}/apim/api_key"
  apim_keystore_s3_bucket              = "nhs-${var.aws_account_id}-${var.region}-${var.environment}-${var.component}-static-assets"
  apim_private_key_ssm_parameter_name  = "/${var.component}/${var.environment}/apim/private_key"

}
