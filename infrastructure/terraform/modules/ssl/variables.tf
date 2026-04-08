##
# Basic Required Variables for tfscaffold Modules
##

variable "project" {
  type        = string
  description = "The name of the tfscaffold project"
}

variable "environment" {
  type        = string
  description = "The name of the tfscaffold environment"
}

variable "component" {
  type        = string
  description = "The name of the tfscaffold component"
}

variable "aws_account_id" {
  type        = string
  description = "The AWS Account ID (numeric)"
}

variable "region" {
  type        = string
  description = "The AWS Region"
}

##
# tfscaffold variables specific to this module
##

variable "default_tags" {
  type        = map(string)
  description = "A map of default tags to apply to all taggable resources within the component"
  default     = {}
}

##
# Variables specific to this module
##

variable "name" {
  type        = string
  description = "A unique name to distinguish this module invocation from others within the same CSI scope"
}

variable "subject_country" {
  type        = string
  description = "Country for certificate subject"
  default     = "GB"
}

variable "subject_province" {
  type        = string
  description = "Province for certificate subject"
  default     = "West Yorkshire"
}

variable "subject_locality" {
  type        = string
  description = "Locality for certificate subject"
  default     = "Leeds"
}

variable "subject_common_name" {
  type        = string
  description = "Common name for certificate subject"
}

variable "subject_organization" {
  type        = string
  description = "Organization for certificate subject"
  default     = "NHS England"
}

variable "subject_organizational_unit" {
  type        = string
  description = "Organizational unit for certificate subject"
  default     = "NHS Notify"
}
