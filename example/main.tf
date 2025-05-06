module "observability_datasource" {
  source = "../infrastructure/modules/observability-datasource"

  project                   = "example-project"
  environment               = "dev"
  component                 = "observability"
  aws_account_id            = "123456789012"
  region                    = "us-east-1"
  name                      = "example-datasource"
  oam_sink_id               = "example-sink-id"
  observability_account_id  = "098765432109"
  default_tags              = { Owner = "team-example", Environment = "dev" }
  resource_types            = [
    "AWS::CloudWatch::Metric",
    "AWS::Logs::LogGroup"
  ]
  log_group_configuration   = {
    filter = "example-log-group-filter"
  }
  metric_configuration      = {
    filter = "example-metric-filter"
  }
}
