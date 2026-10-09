locals {
  module = "lambda"

  package_type = lower(var.package_type)

  lambda_insights_layer_arn = var.enable_lambda_insights && !var.lambda_at_edge ? (
    var.architecture == "arm64" ? "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension-Arm64:20" : "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension:53"
  ) : null

  # Compound Scope Identifier
  csi = replace(
    format(
      "%s-%s-%s-%s",
      var.project,
      var.environment,
      var.component,
      var.function_name,
    ),
    "_",
    "",
  )

  default_tags = merge(
    var.default_tags,
    {
      "Name"   = local.csi
      "Module" = local.module
    },
  )
}
