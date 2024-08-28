data "archive_file" "lambda" {
  type       = "zip"
  source_dir = "${path.module}/${var.function_code_base_path}/${var.function_code_dir}"

  # Timestamp in path to resolve https://github.com/hashicorp/terraform-provider-archive/issues/39
  output_path = "${path.module}/archives/${local.csi}_${timestamp()}.zip"
  excludes = [
    # Python Exclusions
    "**/test",
    "**/__pycache__",

    # NodeJS Exclusions
    "**/__tests__",
    "**/node_modules",
    "**/package.json",
    "**/package-lock.json",
  ]
}
