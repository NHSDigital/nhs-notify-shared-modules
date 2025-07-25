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

variable "deletion_window" {
  type        = string
  description = "KMS key deletion window"
}

variable "alias" {
  type        = string
  description = "Alias name for the hieradata KMS key"
}

variable "key_policy_documents" {
  type        = list(string)
  description = "List of KMS key policy JSON documents"
  default     = []
}

variable "iam_delegation" {
  type        = bool
  description = "Whether to delegate administration of the key to the local account. Defaults to true"
  default     = true
}

variable "is_multi_region" {
  type        = bool
  description = "Whether the KMS key is a multi-region key, where secondary region would mostly be us-east-1. Defaults to false"
  default     = false
}
