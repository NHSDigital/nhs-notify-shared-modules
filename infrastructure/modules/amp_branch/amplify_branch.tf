resource "aws_amplify_branch" "main" {
  app_id                      = var.amplify_app_id
  description                 = var.description
  branch_name                 = var.branch
  display_name                = var.name
  enable_pull_request_preview = var.enable_pull_request_preview
  enable_auto_build           = var.enable_auto_build
  stage                       = var.stage
  framework                   = var.framework

  environment_variables = var.environment_variables
}
