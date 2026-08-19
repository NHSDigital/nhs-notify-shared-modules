output "apim_access_token_ssm_parameter" {
  description = "APIM Access Token SSM parameter details"
  value = {
    name = aws_ssm_parameter.access_token.name
    arn  = aws_ssm_parameter.access_token.arn
  }
}
