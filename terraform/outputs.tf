
# EC2 Instance ID
output "instance_id" {
  description = "Windows EC2 instance ID"
  value       = aws_instance.app.id
}

# Public IP Address
output "public_ip" {
  description = "Public IP address of Windows EC2"
  value       = aws_instance.app.public_ip
}

# Public DNS
output "public_dns" {
  description = "Public DNS of Windows EC2"
  value       = aws_instance.app.public_dns
}

# Windows AMI ID
output "windows_ami_id" {
  description = "Windows Server AMI ID"
  value       = data.aws_ami.windows.id
}

# Security Group ID
output "security_group_id" {
  description = "EC2 security group ID"
  value       = aws_security_group.app.id
}

# AWS Region
output "aws_region" {
  description = "AWS deployment region"
  value       = var.aws_region
}
