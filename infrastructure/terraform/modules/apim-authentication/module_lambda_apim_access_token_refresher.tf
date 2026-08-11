module "lambda_lambda_apim_refresh_token" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/5.0.7/terraform-lambda.zip"

  function_name = "apim-access-token-refresher"
  description   = "A function to generate APIM access tokens"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = var.kms_key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.apim_access_token_refresher.json
  }

  function_s3_bucket      = var.acct_s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = "${path.module}/dist"
  function_code_dir       = "apim-access-token-refresher"
  function_include_common = true
  handler_function_name   = "handler"
  runtime                 = "nodejs22.x"
  memory                  = 256
  timeout                 = var.lambda_timeout_seconds
  log_level               = var.log_level
  schedule                = var.apim_auth_token_schedule

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.log_destination_arn
  log_subscription_role_arn = var.log_subscription_role_arn

  lambda_env_vars = {
    APIM_AUTH_TOKEN_URL                  = var.apim_auth_token_url
    APIM_ACCESS_TOKEN_SSM_PARAMETER_NAME = local.apim_access_token_ssm_parameter_name
    APIM_API_KEY_SSM_PARAMETER_NAME      = local.apim_api_key_ssm_parameter_name
    APIM_PRIVATE_KEY_SSM_PARAMETER_NAME  = local.apim_private_key_ssm_parameter_name
    ENVIRONMENT                          = var.environment
  }
}

data "aws_iam_policy_document" "apim_access_token_refresher" {
  statement {
    sid    = "AllowSSMParam"
    effect = "Allow"

    actions = [
      "ssm:DeleteParameter",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
      "ssm:PutParameter",
    ]

    resources = [
      "arn:aws:ssm:${var.region}:${var.aws_account_id}:parameter/${var.component}/${var.environment}/apim/*"
    ]
  }
}
