module "lambda_apim_key_generation" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/5.0.7/terraform-lambda.zip"

  function_name = "apim-key-generator"
  description   = "A function to generate APIM public and private keys"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = var.kms_key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.lambda_apim_key_generator.json
  }

  function_s3_bucket      = var.acct_s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = "${path.module}/dist"
  function_code_dir       = "apim-key-generator"
  function_include_common = true
  function_module_name    = "lambda"
  handler_function_name   = "handler"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 300
  log_level               = var.log_level
  schedule                = var.apim_keygen_schedule

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.log_destination_arn
  log_subscription_role_arn = var.log_subscription_role_arn

  lambda_env_vars = {
    SSM_PRIVATE_KEY_PARAMETER_NAME = local.apim_private_key_ssm_parameter_name
    KEYSTORE_S3_BUCKET             = local.apim_keystore_s3_bucket
    ENVIRONMENT                    = var.environment
  }
}

data "aws_iam_policy_document" "lambda_apim_key_generator" {
  statement {
    sid    = "AllowS3List"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${local.apim_keystore_s3_bucket}/*"
    ]
  }

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
