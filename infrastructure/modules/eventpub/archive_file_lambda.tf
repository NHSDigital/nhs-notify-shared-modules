resource "archive_file" "lambda" {
  type       = "zip"
  source_dir = "${path.root}/lambda/eventpub/src"

  # Timestamp in path to resolve https://github.com/hashicorp/terraform-provider-archive/issues/39
  output_path = "${path.root}/lambda/eventpub_${timestamp()}.zip"
  excludes = [
    # NodeJS Exclusions
    "**/__tests__",
    "**/node_modules",
    "**/package.json",
    "**/package-lock.json",
  ]
}
