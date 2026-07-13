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
  description = "Name of the SQS Queue"
}

variable "sqs_kms_key_arn" {
  type        = string
  description = "ARN of the KMS key to encrypt SQS queue messages"
}

variable "sqs_policy_overload" {
  type        = string
  description = "Optional additional policy to extend the SQS Resource Policy"
  default     = ""
}

variable "allowed_arns" {
  description = "A list of AWS account IDs allowed to access this resource"
  type        = list(any)
  default     = null
}

variable "message_retention_seconds" {
  description = "The number of seconds Amazon SQS retains a message. Integer representing seconds, from 60 (1 minute) to 1209600 (14 days)"
  type        = number
  default     = null
}

variable "dlq_message_retention_seconds" {
  description = "The number of seconds Amazon SQS retains a message on the DLQ. Integer representing seconds, from 60 (1 minute) to 1209600 (14 days)"
  type        = number
  default     = 1209600
}

variable "visibility_timeout_seconds" {
  description = "The visibility timeout for the queue. An integer from 0 to 43200 (12 hours)"
  type        = number
  default     = 300
}

variable "delay_seconds" {
  description = "Time in seconds that the delivery of all messages in the queue will be delayed. An integer from 0 to 900 (15 minutes)."
  type        = number
  default     = 0
}

variable "fifo_queue" {
  description = "Boolean designating a FIFO queue"
  type        = bool
  default     = false
}

variable "content_based_deduplication" {
  description = "Enables content-based deduplication for FIFO queues"
  type        = bool
  default     = false
}

variable "high_throughput_fifo" {
  description = "Enable high throughput mode for FIFO queues. Limits deduplication scope to message group."
  type        = bool
  default     = false
}

variable "kms_data_key_reuse_period_seconds" {
  description = "The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again. An integer representing seconds, between 60 seconds (1 minute) and 86,400 seconds (24 hours)"
  type        = number
  default     = 300
}

variable "max_message_size" {
  description = "The limit of how many bytes a message can contain before Amazon SQS rejects it. An integer from 1024 bytes (1 KiB) up to 262144 bytes (256 KiB)"
  type        = number
  default     = 262144
}

variable "create_dlq" {
  description = "Create a DLQ"
  type        = bool
  default     = false
}

variable "enable_dlq_alarm" {
  description = "Create a CloudWatch alarm when messages are visible in the DLQ"
  type        = bool
  default     = true
}

variable "dlq_alarm_config" {
  description = "Object of optional CloudWatch alarm settings for the DLQ messages alarm"
  type = object({
    comparison_operator = optional(string, "GreaterThanThreshold")
    evaluation_periods  = optional(number, 1)
    period              = optional(number, 300)
    statistic           = optional(string, "Sum")
    threshold           = optional(number, 0)
    actions_enabled     = optional(bool, true)
    treat_missing_data  = optional(string, "notBreaching")
  })
  default = {}
}

variable "enable_queue_oldest_message_alarm" {
  description = "Create a CloudWatch alarm when the oldest visible message age breaches the configured threshold on the main queue"
  type        = bool
  default     = true
}

variable "queue_oldest_message_alarm_config" {
  description = "Object of optional CloudWatch alarm settings for the main queue oldest message age alarm"
  type = object({
    comparison_operator = optional(string, "GreaterThanThreshold")
    evaluation_periods  = optional(number, 1)
    period              = optional(number, 300)
    statistic           = optional(string, "Maximum")
    threshold           = optional(number, 300)
    actions_enabled     = optional(bool, true)
    treat_missing_data  = optional(string, "notBreaching")
  })
  default = {}
}

variable "max_receive_count" {
  description = "The maximum number of times a message can be received before being sent to the DLQ"
  type        = number
  default     = 3
}
