resource "archive_file" "lambda" {
  type       = "zip"
  source_dir = "."

  # Timestamp in path to resolve https://github.com/hashicorp/terraform-provider-archive/issues/39
  output_path = ".${timestamp()}.zip"
  excludes = [
    # NodeJS Exclusions
    "**/__tests__",
    "**/node_modules",
    "**/package.json",
    "**/package-lock.json",
  ]
}
