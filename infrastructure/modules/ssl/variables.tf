variable "module" {
  type        = string
  description = "The variable encapsulating the name of this module"
  default     = "fe"
}

variable "parameter_bundle" {
  type = object(
    {
      project                             = string
      environment                         = string
      component                           = string
      group                               = string
      region                              = string
      account_ids                         = map(string)
      account_name                        = string
      default_kms_deletion_window_in_days = number
      default_tags                        = map(string)
      iam_resource_arns                   = map(string)
      target_env                          = map(any)
      cicd_bucket_name                    = string
      pipeline_overrides                  = map(any)
      cloudwatch_options                  = map(bool)
      cloudwatch_metric_thresholds        = map(map(string))
      terraform_root_dir                  = string
    }
  )
  description = "Contains all of the default parameters needed by any module in this project"
}

variable "truststore_s3_bucket" {
  type        = string
  description = "The id of the mgmt truststore s3 bucket"
}
