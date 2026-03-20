locals {
  module = "lambda"

  package_type = lower(var.package_type)

  # For Image package types, optionally resolve tag-based URIs to digests
  # when force_lambda_code_deploy is enabled.
  image_uri_parts         = split(":", var.image_uri != null ? var.image_uri : "")
  image_uri_has_digest    = var.image_uri != null ? length(split("@", var.image_uri)) > 1 : false
  image_uri_has_tag       = var.image_uri != null ? length(local.image_uri_parts) == 2 : false
  image_repository_uri    = local.image_uri_has_tag ? local.image_uri_parts[0] : null
  image_tag               = local.image_uri_has_tag ? local.image_uri_parts[1] : null
  image_repository_parts  = local.image_repository_uri != null ? split("/", local.image_repository_uri) : []
  image_repository_name   = local.image_repository_uri != null ? join("/", slice(local.image_repository_parts, 1, length(local.image_repository_parts))) : null
  resolve_image_to_digest = local.package_type == "image" && var.force_lambda_code_deploy && !local.image_uri_has_digest && local.image_uri_has_tag
  effective_image_uri     = local.resolve_image_to_digest ? "${local.image_repository_uri}@${data.aws_ecr_image.lambda[0].image_digest}" : var.image_uri

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
