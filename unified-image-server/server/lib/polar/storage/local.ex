defmodule Polar.Storage.Local do
  @moduledoc """
  Local filesystem storage adapter.

  Stores artifacts on the local filesystem and serves them via the Phoenix
  endpoint. Suitable for development, self-hosted deployments without object
  storage, and the direct-upload workflow from Hye-Ararat/Image-Server.

  Configuration (config.exs):

      config :polar, Polar.Storage.Local,
        base_path: "/var/lib/polar/storage",
        base_url:  "https://images.example.com/storage"
        # base_url is the public URL prefix for serving files.
        # If omitted, files are served via the Phoenix router at /storage/:path.

  The Phoenix router must serve the storage directory:

      get "/storage/*path", Polar.StorageController, :show
  """

  @behaviour Polar.Storage

  @impl true
  def get_signed_url(object_path, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, 3600)
    base_url = config(:base_url, default_base_url())

    # Local adapter uses a simple HMAC token for time-limited access.
    # The StorageController validates this token before serving the file.
    expires_at = System.system_time(:second) + ttl
    token = sign_token(object_path, expires_at)

    "#{base_url}/#{object_path}?token=#{token}&expires=#{expires_at}"
  end

  @impl true
  def put_object(object_path, data, _opts \\ []) do
    full_path = full_path(object_path)
    full_path |> Path.dirname() |> File.mkdir_p!()

    case File.write(full_path, data) do
      :ok -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def delete_object(object_path) do
    full_path = full_path(object_path)

    case File.rm(full_path) do
      :ok -> :ok
      {:error, :enoent} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  # ── Helpers ──────────────────────────────────────────────────────────────────

  def full_path(object_path) do
    base = config(:base_path, "/var/lib/polar/storage")
    Path.join(base, object_path)
  end

  def verify_token(object_path, token, expires_at) do
    now = System.system_time(:second)

    with true <- now < expires_at,
         expected <- sign_token(object_path, expires_at),
         true <- Plug.Crypto.secure_compare(token, expected) do
      :ok
    else
      _ -> {:error, :invalid_token}
    end
  end

  defp sign_token(object_path, expires_at) do
    secret = Application.get_env(:polar, :secret_key_base, "dev-secret")
    :crypto.mac(:hmac, :sha256, secret, "#{object_path}:#{expires_at}")
    |> Base.url_encode64(padding: false)
  end

  defp default_base_url do
    PolarWeb.Endpoint.url() <> "/storage"
  end

  defp config(key, default) do
    Application.get_env(:polar, __MODULE__, [])
    |> Keyword.get(key, default)
  end
end
