resource "null_resource" "force_archive" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "true"
  }
}
