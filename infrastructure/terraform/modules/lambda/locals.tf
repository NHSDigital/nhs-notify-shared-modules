locals {
  module = "lambda"

  package_type = lower(var.package_type)

  handler = var.handler_function_name != "" ? "${var.function_module_name}.${var.handler_function_name}" : var.function_module_name

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
