defmodule Polar.Storage.S3 do
  @moduledoc """
  S3-compatible storage adapter.

  Works with AWS S3, MinIO, Cloudflare R2, Backblaze B2, and any other
  S3-compatible endpoint.

  Configuration (config.exs):

      config :polar, Polar.Storage.S3,
        access_key_id:     System.get_env("STORAGE_ACCESS_KEY_ID"),
        secret_access_key: System.get_env("STORAGE_SECRET_ACCESS_KEY"),
        region:            System.get_env("STORAGE_REGION", "us-east-1"),
        bucket:            System.get_env("STORAGE_BUCKET"),
        endpoint:          System.get_env("STORAGE_ENDPOINT")
        # endpoint is optional — omit for AWS S3, set for MinIO/R2/B2

  Migrated from Polar.Assets (upmaru/polar).
  """

  @behaviour Polar.Storage

  @impl true
  def get_signed_url(object_path, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, 3600)
    body_digest = Keyword.get(opts, :body_digest, "UNSIGNED-PAYLOAD")

    %{
      access_key_id: access_key_id,
      secret_access_key: secret_access_key,
      region: region,
      bucket: bucket,
      endpoint: endpoint
    } = config()

    datetime = :erlang.universaltime()
    url = build_url(endpoint, bucket, object_path)

    :aws_signature.sign_v4_query_params(
      access_key_id,
      secret_access_key,
      region,
      "s3",
      datetime,
      "GET",
      url,
      ttl: ttl,
      body_digest: body_digest
    )
  end

  @impl true
  def put_object(object_path, data, opts \\ []) do
    %{
      access_key_id: access_key_id,
      secret_access_key: secret_access_key,
      region: region
    } = config()

    content_type = Keyword.get(opts, :content_type, "application/octet-stream")

    client = AWS.Client.create(access_key_id, secret_access_key, region)
    client = AWS.Client.put_http_client(client, {AWS.HTTPClient.Finch, [finch_name: Polar.Finch]})

    bucket = config().bucket

    case AWS.S3.put_object(client, bucket, object_path, %{
           "Body" => data,
           "ContentType" => content_type
         }) do
      {:ok, _, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  @impl true
  def delete_object(object_path) do
    %{
      access_key_id: access_key_id,
      secret_access_key: secret_access_key,
      region: region
    } = config()

    client = AWS.Client.create(access_key_id, secret_access_key, region)
    client = AWS.Client.put_http_client(client, {AWS.HTTPClient.Finch, [finch_name: Polar.Finch]})

    bucket = config().bucket

    case AWS.S3.delete_object(client, bucket, object_path, %{}) do
      {:ok, _, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  # ── Helpers ──────────────────────────────────────────────────────────────────

  defp build_url(endpoint, bucket, object_path) do
    if endpoint do
      Path.join(["https://", endpoint, bucket, object_path])
    else
      # Standard AWS S3 virtual-hosted style
      "https://#{bucket}.s3.amazonaws.com/#{object_path}"
    end
  end

  def config do
    Application.get_env(:polar, __MODULE__, [])
    |> Enum.into(%{endpoint: nil})
  end
end
