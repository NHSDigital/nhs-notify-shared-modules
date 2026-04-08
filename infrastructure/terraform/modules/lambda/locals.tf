locals {
  module = "lambda"

  package_type = lower(var.package_type)

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
