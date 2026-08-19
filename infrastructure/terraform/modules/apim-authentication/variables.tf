##
# Basic inherited variables for terraformscaffold modules
##

variable "project" {
  type        = string
  description = "The name of the terraformscaffold project calling the module"
}

variable "environment" {
  type        = string
  description = "The name of the terraformscaffold environment the module is called for"
}

variable "component" {
  type        = string
  description = "The name of the terraformscaffold component calling this module"
}

variable "aws_account_id" {
  type        = string
  description = "The AWS Account ID (numeric)"
}

variable "group" {
  type        = string
  description = "The name of the tfscaffold group"
  default     = null
}

variable "region" {
  type        = string
  description = "The AWS Region"
}

variable "default_tags" {
  type        = map(string)
  description = "A map of default tags to apply to all taggable resources within the component"
  default     = {}
}

variable "acct_s3_buckets" {
  type        = map(any)
  description = "Account S3 buckets"
}

variable "cdn_logs_bucket_id" {
  type        = string
  description = "Bucket for Cloudfront logging"
}

variable "log_subscription_role_arn" {
  type        = string
  description = "ARN for log subscription role"
}

##
# Variable specific to the module
##

variable "log_retention_in_days" {
  type        = number
  description = "The retention period in days for the Cloudwatch Logs events to be retained, default of 0 is indefinite"
  default     = 0
}

variable "kms_key_arn" {
  type        = string
  description = "KMS key arn to use for this function"
}

variable "log_level" {
  type        = string
  description = "The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels"
  default     = "INFO"
}

variable "apim_keygen_schedule" {
  type        = string
  description = "Schedule to refresh key pairs if necessary"
  default     = "cron(0 14 * * ? *)"
}

variable "apim_auth_token_schedule" {
  type        = string
  description = "Schedule to renew the APIM auth token"
  default     = "rate(9 minutes)"
}

variable "force_lambda_code_deploy" {
  type        = bool
  description = "If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development"
  default     = false
}

variable "lambda_timeout_seconds" {
  type        = string
  description = "The timeout of the lambdas that are triggered by SQS. "
  default     = "45"
}

variable "apim_auth_token_url" {
  type        = string
  description = "URL to generate an APIM auth token"
}

variable "name" {
  type        = string
  description = "A unique name to distinguish this module invocation from others within the same CSI scope"
}

variable "shared_infra_account_id" {
  type        = string
  description = "The AWS Shared Infra Account ID (numeric)"
}

variable "force_destroy" {
  type        = bool
  description = "Flag to force deletion of S3 buckets"
  default     = false

  validation {
    condition     = !(var.force_destroy && var.environment == "prod")
    error_message = "force_destroy must not be set to true when environment is 'prod'."
  }
}

variable "parent_acct_environment" {
  type        = string
  description = "Name of the environment responsible for the acct resources used, affects things like DNS zone. Useful for named dev environments"
  default     = "main"
}

variable "root_domain_id" {
  type        = string
  description = "Root domain ID to host the APIM public key"
}

variable "root_domain_name" {
  type        = string
  description = "Root domain name to host the APIM public key"
}
