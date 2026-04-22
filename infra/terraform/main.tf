provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Keep redirect-domain DNS proxied so redirect rules execute at Cloudflare edge.
resource "cloudflare_record" "redirect_apex" {
  zone_id = var.redirect_zone_id
  name    = "@"
  type    = "CNAME"
  value   = var.primary_domain
  proxied = true
}

resource "cloudflare_record" "redirect_www" {
  zone_id = var.redirect_zone_id
  name    = "www"
  type    = "CNAME"
  value   = var.redirect_domain
  proxied = true
}

resource "cloudflare_record" "primary_www" {
  zone_id = var.primary_zone_id
  name    = "www"
  type    = "CNAME"
  value   = var.primary_domain
  proxied = true
}

resource "cloudflare_ruleset" "redirect_domain_to_primary" {
  zone_id = var.redirect_zone_id
  name    = "redirect-citereview-com-to-cite-review"
  description = "301 canonical redirect from citereview.com to cite.review"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules {
    enabled     = true
    action      = "redirect"
    description = "Redirect apex and www to primary domain"
    expression  = "(http.host eq \"citereview.com\" or http.host eq \"www.citereview.com\")"

    action_parameters {
      from_value {
        status_code           = 301
        preserve_query_string = true

        target_url {
          expression = "concat(\"https://cite.review\", http.request.uri.path)"
        }
      }
    }
  }
}

resource "cloudflare_ruleset" "redirect_primary_www_to_apex" {
  zone_id = var.primary_zone_id
  name    = "redirect-www-cite-review-to-apex"
  description = "301 canonical redirect from www.cite.review to cite.review"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules {
    enabled     = true
    action      = "redirect"
    description = "Redirect www host to apex primary host"
    expression  = "(http.host eq \"www.cite.review\")"

    action_parameters {
      from_value {
        status_code           = 301
        preserve_query_string = true

        target_url {
          expression = "concat(\"https://cite.review\", http.request.uri.path)"
        }
      }
    }
  }
}
