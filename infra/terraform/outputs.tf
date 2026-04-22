output "canonical_domain" {
  description = "Primary domain receiving canonical traffic"
  value       = var.primary_domain
}

output "redirect_domain" {
  description = "Domain permanently redirected to canonical domain"
  value       = var.redirect_domain
}
