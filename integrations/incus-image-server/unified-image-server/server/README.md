# server

Elixir/Phoenix simplestreams image server. Based on [upmaru/polar](https://github.com/upmaru/polar),
extended with a storage abstraction layer and a direct multipart upload endpoint.

## Changes from upmaru/polar

| Change | File |
|---|---|
| Storage backend abstraction (S3 + Local adapters) | `lib/polar/storage/` |
| Arch constraint removed from Product changeset | `lib/polar/streams/product.ex` |
| Direct multipart upload endpoint | `lib/polar_web/controllers/publish/upload_controller.ex` |
| Local file serving controller | `lib/polar_web/controllers/storage_controller.ex` |
| Router updated with upload + storage routes | `lib/polar_web/router.ex` |
| Storage adapter config with both backends documented | `config/config.exs` |

## Storage backends

### S3-compatible (default)

Works with AWS S3, MinIO, Cloudflare R2, Backblaze B2 — any S3-compatible endpoint.

```elixir
# config/runtime.exs
config :polar, :storage_adapter, Polar.Storage.S3
config :polar, Polar.Storage.S3,
  access_key_id:     System.get_env("STORAGE_ACCESS_KEY_ID"),
  secret_access_key: System.get_env("STORAGE_SECRET_ACCESS_KEY"),
  region:            System.get_env("STORAGE_REGION", "us-east-1"),
  bucket:            System.get_env("STORAGE_BUCKET"),
  endpoint:          System.get_env("STORAGE_ENDPOINT")
  # endpoint: nil        → AWS S3
  # endpoint: "https://minio.example.com" → MinIO
  # endpoint: "https://<id>.r2.cloudflarestorage.com" → Cloudflare R2
```

### Local filesystem

```elixir
config :polar, :storage_adapter, Polar.Storage.Local
config :polar, Polar.Storage.Local,
  base_path: "/var/lib/polar/storage",
  base_url:  "https://images.example.com/storage"
  # base_url: nil → served via Phoenix at /storage/*path
```

## Publish workflows

### CI/CD workflow (icepak)

The original polar workflow. A GitHub Action uploads artifacts to S3 directly,
then calls the publish API to register metadata.

```
POST /publish/sessions                              → get token
GET  /publish/storage                               → get S3 credentials
POST /publish/products/:id/versions                 → create version
POST /publish/products/:id/versions/:vid/items      → register items
```

### Direct upload workflow

New endpoint derived from Hye-Ararat/Image-Server. Upload artifact files
directly to the server — no S3 credentials or pre-upload required.

```
POST /publish/sessions                                      → get token
POST /publish/products/:id/versions                         → create version
POST /publish/products/:id/versions/:vid/upload             → upload files
```

Multipart fields:
- `rootfs` — `rootfs.tar.xz` (container) or disk image (VM)
- `metadata` — `incus.tar.xz` / `lxd.tar.xz`
- `kvmdisk` — VM disk image (alternative to `rootfs` for VMs)

The server computes SHA-256 hashes, stores via the configured adapter, and
creates Item records.

## Architecture support

The `arch` field on Product accepts any lowercase alphanumeric string.
No fixed list is enforced — `amd64`, `arm64`, `i386`, `riscv64`, `s390x`,
`ppc64le`, etc. are all valid without code changes.

## Development

```bash
mix deps.get
mix ecto.setup
iex -S mix phx.server
```

Server runs on port 4000.
