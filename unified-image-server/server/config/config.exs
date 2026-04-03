import Config

# ── Storage backend ───────────────────────────────────────────────────────────
# Choose one adapter. S3 is the default for production; Local is suitable for
# development and self-hosted deployments without object storage.
#
# S3-compatible (AWS S3, MinIO, Cloudflare R2, Backblaze B2):
#
#   config :polar, :storage_adapter, Polar.Storage.S3
#   config :polar, Polar.Storage.S3,
#     access_key_id:     System.get_env("STORAGE_ACCESS_KEY_ID"),
#     secret_access_key: System.get_env("STORAGE_SECRET_ACCESS_KEY"),
#     region:            System.get_env("STORAGE_REGION", "us-east-1"),
#     bucket:            System.get_env("STORAGE_BUCKET"),
#     endpoint:          System.get_env("STORAGE_ENDPOINT")
#     # endpoint: nil for AWS S3
#     # endpoint: "https://your-minio-host" for MinIO
#     # endpoint: "https://<account>.r2.cloudflarestorage.com" for R2
#     # endpoint: "https://s3.us-west-004.backblazeb2.com" for B2
#
# Local filesystem:
#
#   config :polar, :storage_adapter, Polar.Storage.Local
#   config :polar, Polar.Storage.Local,
#     base_path: System.get_env("STORAGE_BASE_PATH", "/var/lib/polar/storage"),
#     base_url:  System.get_env("STORAGE_BASE_URL")
#     # base_url: nil → served via Phoenix at /storage/*path

config :polar, :storage_adapter, Polar.Storage.S3

# ── Upload limits ─────────────────────────────────────────────────────────────
# Increase Phoenix endpoint upload limit to support large rootfs files.
# Default Phoenix limit is 8 MB; container images can be several GB.
config :polar, PolarWeb.Endpoint,
  http: [
    protocol_options: [
      max_request_line_length: 8192,
      max_header_value_length: 8192
    ]
  ]

# Plug body reader limit for multipart uploads (4 GB)
config :polar, :upload_max_file_size, 4 * 1024 * 1024 * 1024

import_config "#{config_env()}.exs"
