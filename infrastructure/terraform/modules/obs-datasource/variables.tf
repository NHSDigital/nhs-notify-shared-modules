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

variable "oam_sink_id" {
  description = "The ID of the Cloudwatch OAM sink in the appropriate observability account."
  type        = string
  default     = ""
}

variable "observability_account_id" {
  type        = string
  description = "The Observability Account ID that needs access"
}

variable "log_group_configuration" {
  description = "Configuration for filtering log groups in the link configuration." # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/oam_link#link_configuration-block
  type = object({
    filter = string
  })
  default = null
}

variable "metric_configuration" {
  description = "Configuration for filtering metrics in the link configuration." # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/oam_link#link_configuration-block
  type = object({
    filter = string
  })
  default = null
}

variable "resource_types" {
  type        = list(string)
  description = "The resource types to include in the OAM link."
  default = [
    "AWS::CloudWatch::Metric",
    "AWS::Logs::LogGroup"
  ]
}
