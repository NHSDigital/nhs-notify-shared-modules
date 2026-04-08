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
  description = "The group variables are being inherited from (often synonmous with account short-name)"
}

variable "description" {
  type        = string
  description = "Description for the branch"
}

##
# Variable specific to the module
##

# We presume this will always be specified. The default of {} will cause an error if a valid map is not specified.
# If we ever want to define this but allow it to not be specified, then we must provide a default tag keypair will be applied
# as the true default. In any other case default_tags should be removed from the module.
variable "default_tags" {
  type        = map(string)
  description = "Default tag map for application to all taggable resources in the module"
  default     = {}
}

variable "region" {
  type        = string
  description = "The AWS Region"
}

variable "name" {
  type        = string
  description = "A unique name to distinguish this module invocation from others within the same CSI scope"
}

variable "amplify_app_id" {
  type        = string
  description = "Amplify application ID"
}

variable "branch" {
  description = "The name of the branch being deployed"
  type        = string
}

variable "display_name" {
  description = "The display name of the branch app being deployed"
  type        = string
  default     = null
}

variable "enable_auto_build" {
  type        = bool
  description = "Enable the auto build of the branch code as well as just the resources for it"
  default     = false
}

variable "enable_pull_request_preview" {
  type        = bool
  description = "Enable the pull request preview"
  default     = false
}

variable "stage" {
  type        = string
  default     = null
  description = "Determine what stage is being deployed for"
}

variable "framework" {
  type        = string
  default     = null
  description = "Set what framework to use"
}

variable "environment_variables" {
  type        = map(string)
  default     = {}
  description = "Environment variables to be used for amplify branch"
}
