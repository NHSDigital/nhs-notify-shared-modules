resource "null_resource" "lambda_test" {
  triggers = {
    always_run = timestamp()
  }
  provisioner "local-exec" {
    command = <<EOT
      pwd
    EOT
  }
}
