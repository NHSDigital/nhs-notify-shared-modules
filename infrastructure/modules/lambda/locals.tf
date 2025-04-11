locals {
  module = "lambda"

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
