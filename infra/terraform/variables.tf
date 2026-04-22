variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS and Rulesets edit permissions on both zones"
  type        = string
  sensitive   = true
}

variable "primary_zone_id" {
  description = "Zone ID for cite.review"
  type        = string
}

variable "redirect_zone_id" {
  description = "Zone ID for citereview.com"
  type        = string
}

variable "primary_domain" {
  description = "Canonical host"
  type        = string
  default     = "cite.review"
}

variable "redirect_domain" {
  description = "Domain that 301 redirects to primary"
  type        = string
  default     = "citereview.com"
}
