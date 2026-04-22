# Cloudflare Domain Automation

This Terraform module manages:

- DNS records for `citereview.com` and `www.citereview.com`
- 301 redirect rules from `citereview.com` to `cite.review`
- 301 redirect rule from `www.cite.review` to `cite.review`

## Prerequisites

- Terraform >= 1.6
- Cloudflare API token with:
  - Zone:DNS Edit
  - Zone:Zone Edit
  - Zone:Rulesets Edit

## Inputs

Set these as environment variables in CI or your shell:

- `TF_VAR_cloudflare_api_token`
- `TF_VAR_primary_zone_id` (zone id for `cite.review`)
- `TF_VAR_redirect_zone_id` (zone id for `citereview.com`)

Optional (defaults already configured):

- `TF_VAR_primary_domain` (`cite.review`)
- `TF_VAR_redirect_domain` (`citereview.com`)

## Local usage

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply -auto-approve
```

## Expected behavior

- `https://citereview.com/path?a=1` -> `301` -> `https://cite.review/path?a=1`
- `https://www.citereview.com/path?a=1` -> `301` -> `https://cite.review/path?a=1`
- `https://www.cite.review/path?a=1` -> `301` -> `https://cite.review/path?a=1`
