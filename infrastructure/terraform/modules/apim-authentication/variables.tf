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
