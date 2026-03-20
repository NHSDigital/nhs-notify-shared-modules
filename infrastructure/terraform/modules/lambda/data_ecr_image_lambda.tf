data "aws_ecr_image" "lambda" {
  count = local.resolve_image_to_digest ? 1 : 0

  repository_name = local.image_repository_name
  image_tag       = local.image_tag
}
